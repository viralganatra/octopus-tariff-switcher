import { Graffle } from 'graffle';
import { Resource } from 'sst';
import { z } from 'zod';
import { formatISO } from 'date-fns';
import { API_GRAPHQL, API_PRODUCTS } from '../../constants/api';
import { getData } from '../../utils/fetch';
import { logger } from '../../utils/logger';
import type { UnitRatesTariffSelector } from '../../types/tariff';
import type { IsoDateTime, Url } from '../../types/misc';
import { urlSchema } from '../../utils/schema';
import { makeUrl } from '../../utils/helpers';
import { schemaAllProducts } from './schema';
import { getCachedProducts, getCachedToken, setCachedProducts, setCachedToken } from './cache';

export async function fetchToken() {
  const cachedToken = getCachedToken();

  if (cachedToken?.length) {
    return cachedToken;
  }

  logger.info('API: Getting token via mutation ObtainKrakenToken');

  const schema = z.object({
    obtainKrakenToken: z.object({
      token: z.string(),
    }),
  });

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
  });

  const result = await graffle.gql`
    mutation ObtainKrakenToken($input: ObtainJSONWebTokenInput!) {
      obtainKrakenToken(input: $input) {
        token
      }
    }
  `.send({ input: { APIKey: Resource.ApiKey.value } });

  const results = schema.parse(result);

  return setCachedToken(results.obtainKrakenToken.token);
}

export async function fetchAccountInfo() {
  const token = await fetchToken();

  logger.info('API: Getting account info via query Account');

  const schema = z.object({
    account: z.object({
      electricityAgreements: z
        .array(
          z.object({
            validFrom: z.string().datetime({ offset: true }),
            validTo: z.string().datetime({ offset: true }).nullable(),
            meterPoint: z.object({
              mpan: z.string(),
              meters: z
                .array(
                  z.object({
                    serialNumber: z.string(),
                    smartDevices: z
                      .array(
                        z.object({
                          deviceId: z.string(),
                        }),
                      )
                      .nonempty(),
                  }),
                )
                .nonempty(),
            }),
            tariff: z.object({
              productCode: z.string(),
              tariffCode: z.string(),
              standingCharge: z.number(),
            }),
          }),
        )
        .nonempty(),
    }),
  });

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
    headers: {
      authorization: token,
    },
  });

  const result = await graffle.gql`
      query Account($accountNumber: String!) {
        account(accountNumber: $accountNumber) {
          electricityAgreements(active: true) {
            validFrom
            validTo
            meterPoint {
              meters(includeInactive: false) {
                serialNumber
                smartDevices {
                  deviceId
                }
              }
              mpan
            }
            tariff {
              ... on HalfHourlyTariff {
                productCode
                tariffCode
                standingCharge
              }
            }
          }
        }
      }
    `.send({ accountNumber: Resource.AccNumber.value });

  logger.info('API Response: Recieved account info', { apiResponse: result });

  return schema.parse(result);
}

export async function fetchSmartMeterTelemetry({
  deviceId,
  startDate,
  endDate,
}: { deviceId: string; startDate: IsoDateTime; endDate: IsoDateTime }) {
  const token = await fetchToken();

  logger.info('API: Getting smart meter telemetry via query SmartMeterTelemetry', {
    data: {
      startDate,
      endDate,
    },
  });

  const schema = z.object({
    smartMeterTelemetry: z
      .array(
        z.object({
          readAt: z.string(),
          consumptionDelta: z.coerce.number(),
          costDeltaWithTax: z.coerce.number(),
        }),
      )
      .nonempty(),
  });

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
    headers: {
      authorization: token,
    },
  });

  // consumptionDelta - Energy consumption in Wh between the read_at and the next reading.
  // costDeltaWithTax - Energy cost including VAT for the consumption delta in pence.
  // readAt - The start_at time of the telemetry data
  const result = await graffle.gql`
    query smartMeterTelemetry(
      $deviceId: String!,
      $start: DateTime,
      $end: DateTime,
      $grouping: TelemetryGrouping
    ) {
      smartMeterTelemetry(
        deviceId: $deviceId,
        start: $start,
        end: $end,
        grouping: $grouping
      ) {
        readAt
        consumptionDelta
        costDeltaWithTax
      }
    }
  `.send({ deviceId, start: startDate, end: endDate, grouping: 'HALF_HOURLY' });

  logger.info('API Response: Recieved half hourly consumption data', {
    data: {
      startDate,
      endDate,
    },
    apiResponse: result,
  });

  return schema.parse(result);
}

export async function fetchAllProducts() {
  const cachedProducts = getCachedProducts();

  if (getCachedProducts().length) {
    return cachedProducts;
  }

  const url = makeUrl(
    `${API_PRODUCTS}?brand=OCTOPUS_ENERGY&is_business=false&is_variable=true&is_prepay=false`,
  );

  logger.info('API: Getting all products', {
    data: { url },
  });

  const result = await getData({ url });

  logger.info('API Response: Recieved all products', {
    apiResponse: result,
  });

  const { results } = schemaAllProducts.parse(result);

  setCachedProducts(results);

  return results;
}

export async function fetchUnitRatesByTariff(params: UnitRatesTariffSelector) {
  const schema = z.object({
    results: z
      .array(
        z.object({
          value_inc_vat: z.number(),
          valid_from: z.string().datetime(),
          valid_to: z.string().datetime(),
        }),
      )
      .nonempty(),
  });

  const date = params.isoDate ? params.isoDate : formatISO(new Date(), { representation: 'date' });

  const link =
    'url' in params
      ? params.url
      : `${API_PRODUCTS}/${params.productCode}/electricity-tariffs/${params.tariffCode}/standard-unit-rates/`;

  const url = makeUrl(`${link}?period_from=${date}T00:00:00Z&period_to=${date}T23:59:59Z`);

  logger.info('API: Getting unit rates', {
    data: { url, date },
  });

  const result = await getData({ url });

  logger.info('API Response: Received unit rates', {
    data: { url, date },
    apiResponse: result,
  });

  const { results } = schema.parse(result);

  return results;
}

export async function fetchProductDetails({ url }: { url: Url }) {
  logger.info('API: Getting product details', {
    data: { url },
  });

  const schema = z.object({
    single_register_electricity_tariffs: z.record(
      z.string(),
      z.record(
        z.enum(['direct_debit_monthly', 'varying']),
        z.object({
          standing_charge_inc_vat: z.number(),
          links: z.array(
            z.object({
              href: urlSchema,
              rel: z.string(),
            }),
          ),
        }),
      ),
    ),
  });

  const result = await getData({ url });

  logger.info('API Response: Getting product details', {
    data: url,
    apiResponse: result,
  });

  return schema.parse(result);
}

export async function fetchTermsVersion(productCode: string) {
  logger.info(`API: Getting terms version for ${productCode}`);

  const schema = z.object({
    termsAndConditionsForProduct: z.object({
      name: z.string(),
      version: z.string(),
    }),
  });

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
  });

  const result = await graffle.gql`
    query TermsAndConditionsForProduct($productCode: String!) {
      termsAndConditionsForProduct(productCode: $productCode) {
        name
        version
      }
    }
  `.send({ productCode });

  logger.info(`API Response: Getting terms version for ${productCode}`, {
    apiResponse: result,
  });

  const { termsAndConditionsForProduct } = schema.parse(result);

  return termsAndConditionsForProduct;
}

export async function startOnboardingProcess({
  accountNumber,
  mpan,
  productCode,
  changeDate,
}: {
  accountNumber: string;
  mpan: string;
  productCode: string;
  changeDate: string;
}) {
  const token = await fetchToken();

  logger.info('API: Starting tariff switch request via mutation StartOnboardingProcess', {
    data: {
      productCode,
      changeDate,
    },
  });

  const schema = z.object({
    startOnboardingProcess: z.object({
      onboardingProcess: z
        .object({
          id: z.string(),
        })
        .nullable(),
      productEnrolment: z.object({
        id: z.string(),
      }),
      possibleErrors: z
        .array(
          z.object({
            message: z.string(),
            code: z.string(),
          }),
        )
        .optional(),
    }),
  });

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
    headers: {
      authorization: token,
    },
  });

  const result = await graffle.gql`
    mutation StartOnboardingProcess($input: StartSmartOnboardingProcessInput) {
      startOnboardingProcess(input: $input) {
        onboardingProcess {
          id
        }
        productEnrolment {
          id
        }
        possibleErrors {
          message
          code
        }
      }
    }
  `.send({ input: { accountNumber, mpan, productCode, targetAgreementChangeDate: changeDate } });

  logger.info('API Response: Starting tariff switch request for StartOnboardingProcess', {
    data: {
      productCode,
      argetAgreementChangeDate: changeDate,
    },
    apiResponse: result,
  });

  const results = schema.parse(result);

  return results.startOnboardingProcess;
}

export async function acceptTermsAndConditions({
  accountNumber,
  enrolmentId,
  versionMajor,
  versionMinor,
}: { accountNumber: string; enrolmentId: string; versionMajor: number; versionMinor: number }) {
  const token = await fetchToken();

  logger.info('API: Starting mutation AcceptTermsAndConditions', {
    data: {
      versionMajor,
      versionMinor,
    },
  });

  const schema = z.object({
    acceptTermsAndConditions: z.object({
      acceptedVersion: z.string(),
    }),
  });

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
    headers: {
      authorization: token,
    },
  });

  const result = await graffle.gql`
    mutation AcceptTermsAndConditions($input: AcceptTermsAndConditionsInput!) {
      acceptTermsAndConditions(input: $input) {
        acceptedVersion
      }
    }
  `.send({
    input: {
      accountNumber,
      enrolmentId,
      termsVersion: {
        versionMajor,
        versionMinor,
      },
    },
  });

  logger.info('API Response: AcceptTermsAndConditions', {
    data: {
      versionMajor,
      versionMinor,
    },
    apiResponse: result,
  });

  const results = schema.parse(result);

  return results.acceptTermsAndConditions.acceptedVersion;
}
