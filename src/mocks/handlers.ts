import { http, HttpResponse, graphql } from 'msw';
import {
  accountFixture,
  productAgileFixture,
  productCosyFixture,
  productGoFixture,
  productsFixture,
  standingChargeFixture,
  telemetryFixture,
  unitRatesFixture,
} from './fixtures';

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
    'https://api.octopus.energy/v1/products/:tariffCode/electricity-tariffs/:productCode/standing-charges/',
    () => {
      return HttpResponse.json(standingChargeFixture);
    },
  ),
  http.get(
    'https://api.octopus.energy/v1/products/:tariffCode/electricity-tariffs/:productCode/standard-unit-rates',
    () => {
      return HttpResponse.json(unitRatesFixture);
    },
  ),
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
  graphql.query('smartMeterTelemetry', () => {
    return HttpResponse.json({
      data: telemetryFixture,
    });
  }),
];
