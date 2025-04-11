import { http, HttpResponse, graphql, type GraphQLQuery } from 'msw';
import { UnknownProductError } from '../../../errors/unknown-product-error';
import { UnknownTariffError } from '../../../errors/unknown-tariff-error';
import {
  accountFixture,
  productAgileFixture,
  productsFixture,
  termsAndConditionsForProductFixture,
} from '../../../mocks/fixtures';
import { server } from '../../../mocks/node';
import {
  acceptNewAgreement,
  getAccountInfo,
  getEnrollmentId,
  getPotentialRatesAndStandingChargeByTariff,
  getTermsVersion,
  getTodaysConsumptionInHalfHourlyRates,
  getTodaysUnitRatesByTariff,
  verifyNewAgreement,
} from '../api-data';

function useServerHandlerForAccount(fixture: GraphQLQuery) {
  server.use(
    graphql.query('Account', () => {
      return HttpResponse.json({
        data: fixture,
      });
    }),
  );
}

describe('API Data', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
  });

  it('should fetch the account info when the tariff is agile', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const accountInfo = await getAccountInfo();
    const serverRequest = dispatchRequest.mock.lastCall?.at(0).request;

    await expect(serverRequest.json()).resolves.toMatchSnapshot();

    expect(serverRequest.url).toBe('https://api.octopus.energy/v1/graphql/');
    expect(serverRequest.headers.get('authorization')).toBe('foo');
    expect(accountInfo).toEqual({
      currentTariff: {
        displayName: 'Agile Octopus',
        id: 'agile',
        tariffCodeMatcher: '-AGILE-',
      },
      regionCode: 'A',
      deviceId: '00-00-00-00-00-00-99-2F',
      currentStandingCharge: 48.7881,
      mpan: '1012003690000',
      productCode: 'AGILE-24-10-01',
      serialNumber: 'serial number',
    });
  });

  it('should fetch the account info when the tariff is cosy', async () => {
    const fixture = structuredClone(accountFixture);

    // @ts-ignore
    fixture.account.electricityAgreements[0].tariff = {
      tariffCode: 'E-1R-COSY-24-10-01-A',
      productCode: 'COSY-24-10-01',
      standingCharge: 100,
    };

    useServerHandlerForAccount(fixture);

    const accountInfo = await getAccountInfo();

    expect(accountInfo).toEqual({
      currentTariff: {
        displayName: 'Cosy Octopus',
        id: 'cosy',
        tariffCodeMatcher: '-COSY-',
      },
      regionCode: 'A',
      deviceId: '00-00-00-00-00-00-99-2F',
      currentStandingCharge: 100,
      mpan: '1012003690000',
      productCode: 'COSY-24-10-01',
      serialNumber: 'serial number',
    });
  });

  it('should fetch the account info when the tariff is go', async () => {
    const fixture = structuredClone(accountFixture);

    // @ts-ignore
    fixture.account.electricityAgreements[0].tariff = {
      tariffCode: 'E-1R-GO-24-10-01-A',
      productCode: 'GO-24-10-01',
      standingCharge: 10,
    };

    useServerHandlerForAccount(fixture);

    const accountInfo = await getAccountInfo();

    expect(accountInfo).toEqual({
      currentTariff: {
        displayName: 'Octopus Go',
        id: 'go',
        tariffCodeMatcher: '-GO-',
      },
      regionCode: 'A',
      deviceId: '00-00-00-00-00-00-99-2F',
      currentStandingCharge: 10,
      mpan: '1012003690000',
      productCode: 'GO-24-10-01',
      serialNumber: 'serial number',
    });
  });

  it('should throw an error when fetching the account info if the tariff is invalid', async () => {
    const fixture = structuredClone(accountFixture);

    // @ts-ignore
    fixture.account.electricityAgreements[0].tariff.tariffCode = 'INVALID-TARIFF';

    useServerHandlerForAccount(fixture);

    const accountInfo = () => getAccountInfo();

    await expect(accountInfo).rejects.toThrowError(UnknownTariffError);
  });

  it('should fetch todays consumption', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const consumption = await getTodaysConsumptionInHalfHourlyRates({
      deviceId: 'deviceId',
    });

    const serverRequest = dispatchRequest.mock.lastCall?.at(0).request;

    expect(consumption).toMatchSnapshot();
    expect(serverRequest.url).toBe('https://api.octopus.energy/v1/graphql/');
    expect(serverRequest.headers.get('authorization')).toBe('foo');
    await expect(serverRequest.json()).resolves.toMatchSnapshot();
  });

  it('should fetch todays unit rates', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    await getTodaysUnitRatesByTariff({
      tariffCode: 'E-1R-AGILE-18-02-21-A',
      productCode: 'AGILE-18-02-21',
    });

    const serverRequest = dispatchRequest.mock.lastCall?.at(0).request;

    expect(serverRequest.url).toBe(
      'https://api.octopus.energy/v1/products/E-1R-AGILE-18-02-21-A/electricity-tariffs/AGILE-18-02-21/standard-unit-rates/?period_from=2025-03-03T00:00:00Z&period_to=2025-03-03T23:59:59Z',
    );
  });

  it('should fetch the potential rates and standing charge', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const data = await getPotentialRatesAndStandingChargeByTariff({
      tariff: 'Agile Octopus',
      regionCode: 'A',
    });

    const serverRequestOne = dispatchRequest.mock.calls.at(0)?.at(0).request;
    const serverRequestTwo = dispatchRequest.mock.lastCall?.at(0).request;

    expect(data).toMatchSnapshot();
    expect(serverRequestOne.url).toBe(
      'https://api.octopus.energy/v1/products?brand=OCTOPUS_ENERGY&is_business=false&is_variable=true&is_prepay=false',
    );
    expect(serverRequestTwo.url).toBe(
      'https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-A/standard-unit-rates/?period_from=2025-03-03T00:00:00Z&period_to=2025-03-03T23:59:59Z',
    );
  });

  it('should throw an error if no product link is found', async () => {
    const fixture = structuredClone(productsFixture);

    // @ts-ignore
    fixture.results.at(0).links = [];

    server.use(
      http.get('https://api.octopus.energy/v1/products', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const data = () =>
      getPotentialRatesAndStandingChargeByTariff({
        tariff: 'Agile Octopus',
        regionCode: 'A',
      });

    await expect(data).rejects.toThrowError('Unable to find self link for product');
  });

  it('should throw an error if no region is found', async () => {
    const fixture = structuredClone(productAgileFixture);

    // @ts-ignore
    fixture.single_register_electricity_tariffs = {};

    server.use(
      http.get('https://api.octopus.energy/v1/products/AGILE-24-10-01/', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const data = () =>
      getPotentialRatesAndStandingChargeByTariff({
        tariff: 'Agile Octopus',
        regionCode: 'A',
      });

    await expect(data).rejects.toThrowError('Region code not found in product: _A');
  });

  it('should throw an error if the unit rates are missing', async () => {
    const fixture = structuredClone(productAgileFixture);

    // @ts-ignore
    fixture.single_register_electricity_tariffs._A.direct_debit_monthly.links = [];

    server.use(
      http.get('https://api.octopus.energy/v1/products/AGILE-24-10-01/', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const data = () =>
      getPotentialRatesAndStandingChargeByTariff({
        tariff: 'Agile Octopus',
        regionCode: 'A',
      });

    await expect(data).rejects.toThrowError('Standard unit rates link not found for region: _A');
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

  it('should fetch the terms version', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const version = await getTermsVersion('AGILE-24-10-01');

    const serverRequest = dispatchRequest.mock.lastCall?.at(0).request;

    expect(version).toStrictEqual({
      versionMajor: 1,
      versionMinor: 5,
    });
    expect(serverRequest.url).toBe('https://api.octopus.energy/v1/graphql/');

    await expect(serverRequest.json()).resolves.toMatchSnapshot();
  });

  it('should throw an error if terms version is invalid', async () => {
    const fixture = structuredClone(termsAndConditionsForProductFixture);

    fixture.termsAndConditionsForProduct.version = '14';

    server.use(
      graphql.query('TermsAndConditionsForProduct', () => {
        return HttpResponse.json({
          data: fixture,
        });
      }),
    );

    const version = () => getTermsVersion('AGILE-24-10-01');

    await expect(version).rejects.toThrowError(
      'Missing versions in fetching terms & conditions for product: 14',
    );
  });

  it('should start the onboarding process', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const data = await getEnrollmentId({
      mpan: 'mpan',
      targetProductCode: 'COSY-24-10-01',
    });

    const serverRequest = dispatchRequest.mock.lastCall?.at(0).request;

    expect(data).toBe('456');
    expect(serverRequest.url).toBe('https://api.octopus.energy/v1/graphql/');
    expect(serverRequest.headers.get('authorization')).toBe('foo');

    await expect(serverRequest.json()).resolves.toMatchSnapshot();
  });

  it('should accept the new agreement', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const data = await acceptNewAgreement({ enrolmentId: '123', productCode: 'COSY-2024-10-01' });

    const serverRequest = dispatchRequest.mock.lastCall?.at(0).request;

    expect(data).toBe('789');

    await expect(serverRequest.json()).resolves.toMatchSnapshot();
  });

  describe('Verifying the agreement', () => {
    beforeEach(() => {
      vi.runAllTimersAsync();
    });

    it('should verify the new agreement', async () => {
      expect(await verifyNewAgreement()).toBe(true);
    });

    it('should try to verify the agreement up to 2 times', async () => {
      const dispatchRequest = vi.fn();
      const fixture = structuredClone(accountFixture);

      // @ts-ignore
      fixture.account.electricityAgreements[0].validFrom = '2025-03-08T00:00:00+00:00';

      useServerHandlerForAccount(fixture);

      server.events.on('request:start', dispatchRequest);

      const data = await verifyNewAgreement();

      expect(data).toBe(false);
      expect(dispatchRequest).toHaveBeenCalledTimes(2);
    });

    it('should verify the agreement when daylight savings is active', async () => {
      vi.setSystemTime(new Date(2025, 3, 3));

      const fixture = structuredClone(accountFixture);

      // @ts-ignore
      fixture.account.electricityAgreements[0].validFrom = '2025-04-02T23:00:00+00:00';

      useServerHandlerForAccount(fixture);

      expect(await verifyNewAgreement()).toBe(true);
    });
  });
});
