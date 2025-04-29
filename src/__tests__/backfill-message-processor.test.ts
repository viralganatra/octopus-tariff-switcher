import type { Context } from 'aws-lambda';
import { BatchWriteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { messagesFromQueueFixture } from '../mocks/fixtures';
import { processBackfillQueue } from '../backfill-message-processor';

const dynamoDbMock = mockClient(DynamoDBClient);

describe('Backfill Message Processor', () => {
  const context = {} as Context;

  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
    dynamoDbMock.reset();
  });

  it('should batch write messages successfully', async () => {
    dynamoDbMock.on(BatchWriteItemCommand).resolves({ UnprocessedItems: {} });

    const promise = processBackfillQueue({ Records: messagesFromQueueFixture }, context);

    await vi.runAllTimersAsync();
    const data = await promise;

    expect(data).toMatchObject({ batchItemFailures: [] });
    expect(dynamoDbMock).toHaveReceivedCommandTimes(BatchWriteItemCommand, 6);

    const sentCommand1 = dynamoDbMock.commandCalls(BatchWriteItemCommand)[0]!.args[0].input;
    const items1 = sentCommand1.RequestItems!['test-table'] ?? [];

    expect(sentCommand1.RequestItems).toHaveProperty('test-table');
    expect(Object.values(items1)).toHaveLength(25);
    expect(items1).toMatchSnapshot();

    const sentCommand2 = dynamoDbMock.commandCalls(BatchWriteItemCommand)[1]!.args[0].input;
    const items2 = sentCommand2.RequestItems!['test-table'] ?? [];
    expect(items2).toMatchSnapshot();
  });

  it('should retry unprocessed items', async () => {
    dynamoDbMock
      .on(BatchWriteItemCommand)
      .resolvesOnce({
        UnprocessedItems: {
          'test-table': [
            {
              PutRequest: {
                Item: {
                  PK: {
                    S: 'DATE#2025-04-26',
                  },
                  SK: {
                    S: 'USAGE#00:30',
                  },
                  consumptionDelta: {
                    N: '85',
                  },
                  costDelta: {
                    N: '1.3325',
                  },
                  readAt: {
                    S: '2025-04-26T01:30:00+01:00',
                  },
                },
              },
            },
          ],
        },
      })
      .resolves({
        UnprocessedItems: {},
      });

    const promise = processBackfillQueue({ Records: messagesFromQueueFixture }, context);

    await vi.runAllTimersAsync();
    const data = await promise;

    expect(data).toMatchObject({ batchItemFailures: [] });
    expect(dynamoDbMock).toHaveReceivedCommandTimes(BatchWriteItemCommand, 7);
  });

  it('should fail gracefully if any retries fail', async () => {
    dynamoDbMock.on(BatchWriteItemCommand).resolves({
      UnprocessedItems: {
        'test-table': [
          {
            PutRequest: {
              Item: {
                PK: {
                  S: 'DATE#2025-04-26',
                },
                SK: {
                  S: 'USAGE#00:30',
                },
                consumptionDelta: {
                  N: '85',
                },
                costDelta: {
                  N: '1.3325',
                },
                readAt: {
                  S: '2025-04-26T01:30:00+01:00',
                },
              },
            },
          },
        ],
      },
    });

    const promise = processBackfillQueue({ Records: messagesFromQueueFixture }, context);

    await vi.runAllTimersAsync();
    const data = await promise;

    expect(data).toMatchObject({
      batchItemFailures: [
        {
          itemIdentifier: 'b21cf427-381b-4067-9626-baf3ebc1c2ea',
        },
        {
          itemIdentifier: '91f7053c-8de8-4da5-b640-09ce841c7bd5',
        },
        {
          itemIdentifier: '75aa7e13-1155-4389-9d08-b5966e5b870e',
        },
      ],
    });
    expect(dynamoDbMock).toHaveReceivedCommandTimes(BatchWriteItemCommand, 12);
  });
});
