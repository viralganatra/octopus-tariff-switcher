import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { publishHistoricalTariffData } from '../publish-historical-tariff-data';

const sqsMock = mockClient(SQSClient);

describe('Backfill Message Publisher', () => {
  const event = {
    queryStringParameters: {
      backfillFromDate: '2025-03-01',
    },
  } as unknown as APIGatewayProxyEvent;
  const context = {} as Context;

  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
    sqsMock.reset();
  });

  it('should throw an error if the backfillFromDate query param is missing', async () => {
    expect(
      await publishHistoricalTariffData({} as APIGatewayProxyEvent, context),
    ).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Error: backfillFromDate query parameter is missi¬ng, please provide a date in the format YYYY-MM-DD"
      }",
        "statusCode": 500,
      }
    `);
  });

  it('should successfully send all daily usage data in a single batch', async () => {
    sqsMock.on(SendMessageBatchCommand).resolves({
      Failed: [],
    });

    const promise = publishHistoricalTariffData(event, context);

    await vi.runAllTimersAsync();

    expect(await promise).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Backfill data from 2025-03-01 successfully generated and sent to the queue"
      }",
        "statusCode": 200,
      }
    `);

    const params = sqsMock.call(0).args.at(0)?.input as SendMessageBatchCommand['input'];

    expect(params.QueueUrl).toBe('https://sqs.us-east-1.amazonaws.com/123456789/queue');
    expect(params.Entries).toHaveLength(2);
    expect(sqsMock).toHaveReceivedCommandTimes(SendMessageBatchCommand, 1);

    const entries = params.Entries!;

    expect(entries[0]?.Id).toBe('msg-0');
    expect(JSON.parse(entries[0]!.MessageBody!)).toMatchObject({
      isoDate: '2025-03-01',
      productCode: 'AGILE-24-10-01',
      tariffCode: 'E-1R-AGILE-24-10-01-A',
      standingCharge: 47.6062,
      tariffName: 'Agile Octopus',
      consumption: expect.any(Array),
      unitRates: expect.any(Array),
      id: 'agile',
    });
  });

  it('should retry sending failed messages and succeed', async () => {
    sqsMock
      .on(SendMessageBatchCommand)
      .resolvesOnce({
        Failed: [{ Id: 'msg-1', SenderFault: false, Code: 'Invalid' }],
      })
      .resolves({
        Failed: [],
      });

    const promise = publishHistoricalTariffData(event, context);

    await vi.runAllTimersAsync();

    expect(await promise).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Backfill data from 2025-03-01 successfully generated and sent to the queue"
      }",
        "statusCode": 200,
      }
    `);

    expect(sqsMock).toHaveReceivedCommandTimes(SendMessageBatchCommand, 2);

    expect(sqsMock).toHaveReceivedNthCommandWith(1, SendMessageBatchCommand, {
      Entries: expect.arrayContaining([
        {
          Id: 'msg-1',
          MessageBody: expect.any(String),
          MessageDeduplicationId: '2025-03-02',
          MessageGroupId: 'service-id',
        },
      ]),
    });
  });

  it('should throw an error if a batch fails', async () => {
    sqsMock.on(SendMessageBatchCommand).resolves({
      Failed: [
        { Id: 'msg-0', SenderFault: false, Code: 'Invalid' },
        { Id: 'msg-1', SenderFault: false, Code: 'Invalid' },
      ],
    });

    const promise = publishHistoricalTariffData(event, context);

    await vi.runAllTimersAsync();

    expect(await promise).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Error: Batch retry triggered: Failed SQS messages: 2025-03-01, 2025-03-02"
      }",
        "statusCode": 500,
      }
    `);

    expect(sqsMock).toHaveReceivedCommandTimes(SendMessageBatchCommand, 4);
  });
});
