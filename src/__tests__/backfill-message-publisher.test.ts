import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { publishBackfillMessages } from '../backfill-message-publisher';

const sqsMock = mockClient(SQSClient);

describe('Backfill Message Publisher', () => {
  const proxy = {} as APIGatewayProxyEvent;
  const context = {} as Context;

  beforeEach(() => {
    vi.stubEnv('BACKFILL_FROM_DATE', '2025-03-01');
    vi.setSystemTime(new Date(2025, 2, 3));
    sqsMock.reset();
  });

  it('should throw an error if the BACKFILL_FROM_DATE env var is not set', async () => {
    vi.stubEnv('BACKFILL_FROM_DATE', undefined);

    expect(await publishBackfillMessages(proxy, context)).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Error: BACKFILL_FROM_DATE env variable is not set"
      }",
        "statusCode": 500,
      }
    `);
  });

  it('should successfully send all daily usage data in a single batch', async () => {
    sqsMock.on(SendMessageBatchCommand).resolves({
      Failed: [],
    });

    const promise = publishBackfillMessages(proxy, context);

    await vi.runAllTimersAsync();

    expect(await promise).toMatchInlineSnapshot(`
      {
        "body": "{"message":"Backfill data successfully generated and sent to queue"}",
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

    const promise = publishBackfillMessages(proxy, context);

    await vi.runAllTimersAsync();

    expect(await promise).toMatchInlineSnapshot(`
      {
        "body": "{"message":"Backfill data successfully generated and sent to queue"}",
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

    const promise = publishBackfillMessages(proxy, context);

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
