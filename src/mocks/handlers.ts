import { http, HttpResponse, graphql } from 'msw';
import { formatISO } from 'date-fns';
import {
  acceptTermsAndConditionsFxture,
  accountFixture,
  onboardingProcessFixture,
  productAgileFixture,
  productCosyFixture,
  productGoFixture,
  productsFixture,
  telemetryFixture,
  termsAndConditionsForProductFixture,
  unitRatesFixture,
  unitRates2020Fixture,
  telemetry2020Fixture,
  standingChargeAgileFixture,
  standingChargeCosyFixture,
  consumptionAgileFixture,
  consumptionCosyFixture,
  accountRestFixture,
} from './fixtures';

function extractYearFromDate(date: string) {
  return Number(date.split('-').at(0));
}

function getPeriodFromQueryAsIsoDate(request: Request) {
  const url = new URL(request.url);
  const periodFrom = url.searchParams.get('period_from') as string;
  const date = formatISO(periodFrom, { representation: 'date' });

  return date;
}

export const handlers = [
  http.get('https://api.octopus.energy/v1/products', () => {
    return HttpResponse.json(productsFixture);
  }),
  http.get('https://api.octopus.energy/v1/products/AGILE-24-10-01/', () => {
    return HttpResponse.json(productAgileFixture);
  }),
  http.get('https://api.octopus.energy/v1/products/COSY-22-12-08/', () => {
    return HttpResponse.json(productCosyFixture);
  }),
  http.get('https://api.octopus.energy/v1/products/GO-VAR-22-10-14/', () => {
    return HttpResponse.json(productGoFixture);
  }),
  http.get(
    'https://api.octopus.energy/v1/products/:productCode/electricity-tariffs/:tariffCode/standard-unit-rates',
    ({ request }) => {
      const date = getPeriodFromQueryAsIsoDate(request);

      if (extractYearFromDate(date) === 2020) {
        return HttpResponse.json(unitRates2020Fixture);
      }

      return HttpResponse.json(unitRatesFixture(date));
    },
  ),
  http.get(
    'https://api.octopus.energy/v1/products/:productCode/electricity-tariffs/:tariffCode/standing-charges/',
    ({ params }) => {
      if (params.productCode?.includes('COSY')) {
        return HttpResponse.json(standingChargeCosyFixture);
      }
      return HttpResponse.json(standingChargeAgileFixture);
    },
  ),
  http.get(
    'https://api.octopus.energy/v1/electricity-meter-points/:mpan/meters/:serialNumber/consumption/',
    ({ request }) => {
      const date = getPeriodFromQueryAsIsoDate(request);

      if (extractYearFromDate(date) === 2020) {
        return HttpResponse.json(consumptionCosyFixture);
      }
      return HttpResponse.json(consumptionAgileFixture(date));
    },
  ),
  http.get('https://api.octopus.energy/v1/accounts/:accountId/', () => {
    return HttpResponse.json(accountRestFixture);
  }),
  http.post('https://api.mjml.io/v1/render', async ({ request }) => {
    const data = (await request.json()) as { mjml: string };

    return HttpResponse.json({
      html: data.mjml,
    });
  }),
  graphql.mutation('ObtainKrakenToken', () => {
    return HttpResponse.json({
      data: {
        obtainKrakenToken: {
          token: 'foo',
        },
      },
    });
  }),
  graphql.query('Account', () => {
    return HttpResponse.json({
      data: accountFixture,
    });
  }),
  graphql.query('smartMeterTelemetry', ({ variables }) => {
    if (extractYearFromDate(variables.start) === 2020) {
      return HttpResponse.json({
        data: telemetry2020Fixture,
      });
    }

    return HttpResponse.json({
      data: telemetryFixture,
    });
  }),
  graphql.query('TermsAndConditionsForProduct', () => {
    return HttpResponse.json({
      data: termsAndConditionsForProductFixture,
    });
  }),
  graphql.mutation('StartOnboardingProcess', () => {
    return HttpResponse.json({
      data: onboardingProcessFixture,
    });
  }),
  graphql.mutation('AcceptTermsAndConditions', () => {
    return HttpResponse.json({
      data: acceptTermsAndConditionsFxture,
    });
  }),
];
