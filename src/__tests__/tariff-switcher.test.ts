import { graphql, http, HttpResponse } from 'msw';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { server } from '../mocks/node';
import { tariffSwitcher } from '../tariff-switcher';
import * as email from '../notifications/email';
import * as ApiData from '../functions/tariff-switcher/api-data';
import { accountFixture, productGoFixture } from '../mocks/fixtures';

describe('Tariff Switcher', () => {
  const proxy = {} as APIGatewayProxyEvent;
  const context = {} as Context;

  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
  });

  it('should switch to the cheapest tariff and send a notification', async () => {
    const spy = vi.spyOn(email, 'sendEmail');
    const promise = tariffSwitcher(proxy, context);

    await vi.runAllTimersAsync();

    const data = await promise;

    // @ts-ignore
    const emailData = spy.mock.calls[0][0];

    expect(emailData).toMatchSnapshot();
    expect(data.body).toMatchInlineSnapshot(`
      "{
        "message": "Going to switch to Octopus Go - £0.47 from Agile Octopus - £0.80"
      }"
    `);
  });

  it('should throw an error if the new agreement cannot be verified', async () => {
    const fixture = structuredClone(accountFixture);

    // @ts-ignore
    fixture.account.electricityAgreements[0].validFrom = '2025-03-08T00:00:00+00:00';

    server.use(
      graphql.query('Account', () => {
        return HttpResponse.json({
          data: fixture,
        });
      }),
    );

    const promise = tariffSwitcher(proxy, context);

    await vi.runAllTimersAsync();

    const data = await promise;

    expect(data).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Unable to verify new agreement after multiple retries. Please check your account and emails."
      }",
        "statusCode": 500,
      }
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

    const promise = tariffSwitcher(proxy, context);

    await vi.runAllTimersAsync();

    const data = await promise;

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

    const promise = tariffSwitcher(proxy, context);

    await vi.runAllTimersAsync();

    const data = await promise;

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

    const promise = tariffSwitcher(proxy, context);

    await vi.runAllTimersAsync();

    const data = await promise;

    expect(data).toMatchInlineSnapshot(`
      {
        "body": "{
        "message": "Failed to fetch"
      }",
        "statusCode": 500,
      }
    `);
  });

  describe('DRY_RUN', () => {
    beforeAll(() => {
      vi.stubEnv('DRY_RUN', 'true');
    });

    afterAll(() => {
      vi.stubEnv('DRY_RUN', 'false');
    });

    it('should not send an email if the DRY_RUN param is true', async () => {
      const spy = vi.spyOn(email, 'sendEmail');
      const promise = tariffSwitcher(proxy, context);

      await vi.runAllTimersAsync();
      await promise;

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not switch the tariff if the DRY_RUN param is true', async () => {
      const spy = vi.spyOn(ApiData, 'getEnrollmentId');
      const promise = tariffSwitcher(proxy, context);

      await vi.runAllTimersAsync();
      await promise;

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
