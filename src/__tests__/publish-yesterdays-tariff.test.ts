import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { publishYesterdaysTariff } from '../publish-yesterdays-tariff';

const sqsMock = mockClient(SQSClient);

describe('Yestedays Message Publisher', () => {
  const event = {} as APIGatewayProxyEvent;
  const context = {} as Context;

  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
    sqsMock.reset();
  });

  it(`should publish yesterday's tariff data`, async () => {
    sqsMock.on(SendMessageBatchCommand).resolves({
      Failed: [],
    });

    const promise = publishYesterdaysTariff(event, context);

    await vi.runAllTimersAsync();

    expect(await promise).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Yesterday's data successfully generated and sent to the queue: 2025-03-02"
      }",
        "statusCode": 200,
      }
    `);

    const params = sqsMock.call(0).args.at(0)?.input as SendMessageBatchCommand['input'];

    expect(params.QueueUrl).toBe('https://sqs.us-east-1.amazonaws.com/123456789/queue');
    expect(params.Entries).toHaveLength(1);
    expect(sqsMock).toHaveReceivedCommandTimes(SendMessageBatchCommand, 1);

    const entries = params.Entries!;

    expect(entries[0]?.Id).toBe('msg-0');
    expect(JSON.parse(entries[0]!.MessageBody!)).toMatchObject({
      isoDate: '2025-03-02',
      productCode: 'AGILE-24-10-01',
      tariffCode: 'E-1R-AGILE-24-10-01-A',
      standingCharge: 47.6062,
      tariffName: 'Agile Octopus',
      consumption: expect.any(Array),
      unitRates: expect.any(Array),
      id: 'agile',
    });
  });
});
