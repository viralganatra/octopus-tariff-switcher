import { http, HttpResponse, graphql } from 'msw';
import { UnknownProductError } from '../../../errors/unknown-product-error';
import { UnknownTariffError } from '../../../errors/unknown-tariff-error';
import { accountFixture } from '../../../mocks/fixtures';
import { server } from '../../../mocks/node';
import {
  getAccountInfo,
  getOppositeTariff,
  getPotentialRatesAndStandingChargeByTariff,
  getTodaysConsumptionInHalfHourlyRates,
  getTodaysUnitRatesByTariff,
  getToken,
} from '../api-data';

describe('API Data', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
  });

  it('should return a token from the api or reuse it if it exists', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const token = await getToken();
    await getToken();
    await getToken();

    expect(token).toBe('foo');

    // @ts-ignore
    const serverRequest = dispatchRequest.mock.calls[0][0].request;

    await expect(serverRequest.json()).resolves.toMatchObject(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: {
            APIKey: 'API_KEY',
          },
        }),
      }),
    );

    expect(dispatchRequest).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        request: expect.objectContaining({
          url: 'https://api.octopus.energy/v1/graphql/',
        }),
      }),
    );
  });

  it('should return the opposite tariff', () => {
    expect(getOppositeTariff('Agile Octopus')).toBe('Cosy Octopus');
    expect(getOppositeTariff('Cosy Octopus')).toBe('Agile Octopus');
  });

  it('should fetch the account info when the tariff is agile', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const accountInfo = await getAccountInfo();

    expect(accountInfo).toEqual({
      currentTariff: 'Agile Octopus',
      regionCode: 'A',
      deviceId: '00-00-00-00-00-00-99-2F',
      currentStandingCharge: 48.7881,
    });

    // @ts-ignore
    const serverRequest = dispatchRequest.mock.calls[0][0].request;

    await expect(serverRequest.json()).resolves.toMatchObject(
      expect.objectContaining({
        variables: expect.objectContaining({
          accountNumber: 'A-123456',
        }),
      }),
    );
  });

  it('should fetch the account info when the tariff is cosy', async () => {
    const fixture = structuredClone(accountFixture);

    // @ts-ignore
    fixture.account.electricityAgreements[0].tariff = {
      tariffCode: 'E-1R-COSY-24-10-01-A',
      productCode: 'COSY-24-10-01',
      standingCharge: 100,
    };

    server.use(
      graphql.query('Account', () => {
        return HttpResponse.json({
          data: fixture,
        });
      }),
    );

    const accountInfo = await getAccountInfo();

    expect(accountInfo).toEqual({
      currentTariff: 'Cosy Octopus',
      regionCode: 'A',
      deviceId: '00-00-00-00-00-00-99-2F',
      currentStandingCharge: 100,
    });
  });

  it('should throw an error when fetching the account info if the tariff is neither cosy or agile', async () => {
    const fixture = structuredClone(accountFixture);

    // @ts-ignore
    fixture.account.electricityAgreements[0].tariff.tariffCode = 'INVALID-TARIFF';

    server.use(
      graphql.query('Account', () => {
        return HttpResponse.json({
          data: fixture,
        });
      }),
    );

    const accountInfo = () => getAccountInfo();

    await expect(accountInfo).rejects.toThrowError(UnknownTariffError);
  });

  it('should fetch todays consumption', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const consumption = await getTodaysConsumptionInHalfHourlyRates({
      deviceId: 'deviceId',
    });

    // @ts-ignore
    const serverRequest = dispatchRequest.mock.calls[0][0].request;

    expect(consumption).toMatchSnapshot();
    expect(serverRequest.url).toBe('https://api.octopus.energy/v1/graphql/');
    expect(serverRequest.headers.get('authorization')).toBe('foo');

    await expect(serverRequest.json()).resolves.toMatchObject(
      expect.objectContaining({
        variables: expect.objectContaining({
          deviceId: 'deviceId',
          end: '2025-03-03T23:59:59Z',
          grouping: 'HALF_HOURLY',
          start: '2025-03-03T00:30:00Z',
        }),
      }),
    );
  });

  it('should fetch todays unit rates', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    await getTodaysUnitRatesByTariff({
      tariffCode: 'E-1R-AGILE-18-02-21-A',
      productCode: 'AGILE-18-02-21',
    });

    // @ts-ignore
    const serverRequest = dispatchRequest.mock.calls[0][0].request;

    expect(serverRequest.url).toBe(
      'https://api.octopus.energy/v1/products/E-1R-AGILE-18-02-21-A/electricity-tariffs/AGILE-18-02-21/standard-unit-rates/?period_from=2025-03-03T00:00:00Z&period_to=2025-03-03T23:59:59Z',
    );
  });

  it('should fetch the potential rates and standing charge', async () => {
    const data = await getPotentialRatesAndStandingChargeByTariff({
      tariff: 'Agile Octopus',
      regionCode: 'A',
    });

    expect(data).toMatchSnapshot();
  });

  it('should throw an error if no product is found', async () => {
    server.use(
      http.get('https://api.octopus.energy/v1/products', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        });
      }),
    );

    const data = () =>
      getPotentialRatesAndStandingChargeByTariff({
        tariff: 'Agile Octopus',
        regionCode: 'A',
      });

    await expect(data).rejects.toThrowError(UnknownProductError);
  });
});
