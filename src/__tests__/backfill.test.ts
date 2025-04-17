import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { backfill } from '../backfill';

describe('Backfill', () => {
  const proxy = {} as APIGatewayProxyEvent;
  const context = {} as Context;

  beforeEach(() => {
    vi.stubEnv('BACKFILL_FROM_DATE', '2025-03-01');
    vi.setSystemTime(new Date(2025, 2, 3));
  });

  it('should calculate the daily cost and usage for each date', async () => {
    const promise = backfill(proxy, context);

    await vi.runAllTimersAsync();

    expect(await promise).toMatchInlineSnapshot(`
      {
        "body": "{"message":"Backfill complete","data":{"2025-03-01":{"cost":220.0159},"2025-03-02":{"cost":220.0159}}}",
        "statusCode": 200,
      }
    `);
  });

  it('should throw an error if the BACKFILL_FROM_DATE env var is not set', async () => {
    vi.stubEnv('BACKFILL_FROM_DATE', undefined);

    expect(await backfill(proxy, context)).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "BACKFILL_FROM_DATE env variable is not set"
      }",
        "statusCode": 500,
      }
    `);
  });
});
