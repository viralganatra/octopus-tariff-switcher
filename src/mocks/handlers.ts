import { http, HttpResponse, graphql } from 'msw';
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
} from './fixtures';

function extractYearFromDate(date: string) {
  return Number(date.split('-').at(0));
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
    'https://api.octopus.energy/v1/products/:tariffCode/electricity-tariffs/:productCode/standard-unit-rates',
    ({ request }) => {
      const url = new URL(request.url);
      const periodFrom = url.searchParams.get('period_from') as string;

      if (extractYearFromDate(periodFrom) === 2020) {
        return HttpResponse.json(unitRates2020Fixture);
      }

      return HttpResponse.json(unitRatesFixture);
    },
  ),
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
