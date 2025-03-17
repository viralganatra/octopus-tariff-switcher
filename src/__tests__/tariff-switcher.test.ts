import { http, HttpResponse } from 'msw';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { server } from '../mocks/node';
import { tariffSwitcher } from '../tariff-switcher';
import * as email from '../notifications/email';
import { productGoFixture } from '../mocks/fixtures';

describe('Tariff Switcher', () => {
  const proxy = {} as APIGatewayProxyEvent;
  const context = {} as Context;

  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
  });

  it('should switch to the cheapest tariff and send a notification', async () => {
    const spy = vi.spyOn(email, 'sendEmail');
    const data = await tariffSwitcher(proxy, context);

    // @ts-ignore
    const emailData = spy.mock.calls[0][0];

    expect(emailData).toMatchSnapshot();
    expect(data.body).toMatchInlineSnapshot(`
      "{
        "message": "Going to switch to Octopus Go - £0.47 from Agile Octopus - £0.80"
      }"
    `);
  });

  it('should not switch the tariff if it is already the cheapest and send a notification', async () => {
    const spy = vi.spyOn(email, 'sendEmail');
    const fixture = structuredClone(productGoFixture);

    fixture.single_register_electricity_tariffs._A.direct_debit_monthly.standing_charge_inc_vat = 48.788145;

    server.use(
      http.get('https://api.octopus.energy/v1/products/GO-VAR-22-10-14/', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const data = await tariffSwitcher(proxy, context);

    // @ts-ignore
    const emailData = spy.mock.calls[0][0];

    expect(emailData).toMatchSnapshot();
    expect(data.body).toMatchInlineSnapshot(`
      "{
        "message": "You are already on the cheapest tariff: Agile Octopus - £0.80"
      }"
    `);
  });

  it('should not switch the tariff if the difference is less than 2p and send a notification', async () => {
    const spy = vi.spyOn(email, 'sendEmail');
    const fixture = structuredClone(productGoFixture);

    fixture.single_register_electricity_tariffs._A.direct_debit_monthly.standing_charge_inc_vat = 40;

    server.use(
      http.get('https://api.octopus.energy/v1/products/GO-VAR-22-10-14/', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const data = await tariffSwitcher(proxy, context);

    // @ts-ignore
    const emailData = spy.mock.calls[0][0];

    expect(emailData).toMatchSnapshot();
    expect(data.body).toMatchInlineSnapshot(`
      "{
        "message": "Not worth switching to Octopus Go from Agile Octopus"
      }"
    `);
  });

  it('should catch all errors', async () => {
    server.use(
      http.get('https://api.octopus.energy/v1/products/COSY-22-12-08/', () => HttpResponse.error()),
    );

    const data = await tariffSwitcher(proxy, context);

    expect(data).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Failed to fetch"
      }",
        "statusCode": 500,
      }
    `);
  });
});
