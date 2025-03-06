import { http, HttpResponse } from 'msw';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { server } from '../mocks/node';
import { tariffSwitcher } from '../tariff-switcher';

describe('Tariff Switcher', () => {
  const proxy = {} as APIGatewayProxyEvent;
  const context = {} as Context;

  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
  });

  it('should switch the tariff if it is cheaper that the current tariff', async () => {
    const data = await tariffSwitcher(proxy, context);

    expect(data).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Not switching from Agile Octopus to Cosy Octopus, as today's cost £0.80 is cheaper than £0.89"
      }",
        "statusCode": 200,
      }
    `);
  });

  it('should not switch the tariff if it is more expensive than the current tariff', async () => {
    const fixture = {
      count: 7,
      next: null,
      previous: null,
      results: [
        {
          value_exc_vat: 2.6016,
          value_inc_vat: 3.23168,
          valid_from: '2025-03-03T22:00:00Z',
          valid_to: '2025-03-02T00:00:00Z',
          payment_method: null,
        },
        {
          value_exc_vat: 5.6966,
          value_inc_vat: 6.98143,
          valid_from: '2025-03-03T19:00:00Z',
          valid_to: '2025-03-03T22:00:00Z',
          payment_method: null,
        },
        {
          value_exc_vat: 3.545,
          value_inc_vat: 4.47225,
          valid_from: '2025-03-03T16:00:00Z',
          valid_to: '2025-03-03T19:00:00Z',
          payment_method: null,
        },
        {
          value_exc_vat: 2.6016,
          value_inc_vat: 3.23168,
          valid_from: '2025-03-03T13:00:00Z',
          valid_to: '2025-03-03T16:00:00Z',
          payment_method: null,
        },
        {
          value_exc_vat: 5.6966,
          value_inc_vat: 6.98143,
          valid_from: '2025-03-03T07:00:00Z',
          valid_to: '2025-03-03T13:00:00Z',
          payment_method: null,
        },
        {
          value_exc_vat: 2.6016,
          value_inc_vat: 3.23168,
          valid_from: '2025-03-03T04:00:00Z',
          valid_to: '2025-03-03T07:00:00Z',
          payment_method: null,
        },
        {
          value_exc_vat: 5.6966,
          value_inc_vat: 6.98143,
          valid_from: '2025-03-03T00:00:00Z',
          valid_to: '2025-03-03T04:00:00Z',
          payment_method: null,
        },
      ],
    };

    server.use(
      http.get(
        'https://api.octopus.energy/v1/products/:tariffCode/electricity-tariffs/:productCode/standard-unit-rates',
        () => {
          return HttpResponse.json(fixture);
        },
      ),
    );

    const data = await tariffSwitcher(proxy, context);

    expect(data).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Going to switch from Agile Octopus to Cosy Octopus, as today's cost £0.80 is more expensive than £0.61"
      }",
        "statusCode": 200,
      }
    `);
  });
});
