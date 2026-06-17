import { Resource } from 'sst';
import { formatISO } from 'date-fns';
import { API_PRODUCTS } from '../../constants/api';
import { getData, graphqlRequest } from '../../utils/fetch';
import { OnboardingError } from '../../errors/onboarding-error';
import { logger } from '../../utils/logger';
import type { UnitRatesTariffSelector } from '../../types/tariff';
import type { IsoDateTime, Url } from '../../types/misc';
import { makeUrl } from '../../utils/helpers';
import {
  schemaAcceptTsAndCs,
  schemaAccount,
  schemaAllProducts,
  schemaProductDetails,
  schemaSmartMeterTelemetry,
  schemaStartOnboardingProcess,
  schemaTermsVersion,
  schemaToken,
  schemaUnitRatesByTariff,
} from './schema';
import { getCachedProducts, getCachedToken, setCachedProducts, setCachedToken } from './cache';

export async function fetchToken() {
  const cachedToken = getCachedToken();

  if (cachedToken) {
    return cachedToken;
  }

  logger.info('API: Getting token via mutation ObtainKrakenToken');

  const result = await graphqlRequest({
    query: `
    mutation ObtainKrakenToken($input: ObtainJSONWebTokenInput!) {
      obtainKrakenToken(input: $input) {
        token
      }
    }
  `,
    variables: { input: { APIKey: Resource.ApiKey.value } },
  });

  const results = schemaToken.parse(result);

  return setCachedToken(results.obtainKrakenToken.token);
}

export async function fetchAccountInfo() {
  const token = await fetchToken();

  logger.info('API: Getting account info via query Account');

  const result = await graphqlRequest({
    query: `
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
    `,
    variables: { accountNumber: Resource.AccNumber.value },
    headers: {
      authorization: token,
    },
  });

  logger.info('API Response: Recieved account info', { apiResponse: result });

  return schemaAccount.parse(result);
}

export async function fetchSmartMeterTelemetry({
  deviceId,
  startDate,
  endDate,
}: {
  deviceId: string;
  startDate: IsoDateTime;
  endDate: IsoDateTime;
}) {
  const token = await fetchToken();

  logger.info('API: Getting smart meter telemetry via query SmartMeterTelemetry', {
    data: {
      startDate,
      endDate,
    },
  });

  // consumptionDelta - Energy consumption in Wh between the read_at and the next reading.
  // costDeltaWithTax - Energy cost including VAT for the consumption delta in pence.
  // readAt - The start_at time of the telemetry data
  const result = await graphqlRequest({
    query: `
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
  `,
    variables: { deviceId, start: startDate, end: endDate, grouping: 'HALF_HOURLY' },
    headers: {
      authorization: token,
    },
  });

  logger.info('API Response: Recieved half hourly consumption data', {
    data: {
      startDate,
      endDate,
    },
    apiResponse: result,
  });

  const { smartMeterTelemetry } = schemaSmartMeterTelemetry.parse(result);

  return smartMeterTelemetry;
}

export async function fetchAllProducts() {
  const cachedProducts = getCachedProducts();

  if (cachedProducts.length) {
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

  const { results } = schemaUnitRatesByTariff.parse(result);

  return results;
}

export async function fetchProductDetails({ url }: { url: Url }) {
  logger.info('API: Getting product details', {
    data: { url },
  });

  const result = await getData({ url });

  logger.info('API Response: Getting product details', {
    data: url,
    apiResponse: result,
  });

  return schemaProductDetails.parse(result);
}

export async function fetchTermsVersion(productCode: string) {
  logger.info(`API: Getting terms version for ${productCode}`);

  const result = await graphqlRequest({
    query: `
    query TermsAndConditionsForProduct($productCode: String!) {
      termsAndConditionsForProduct(productCode: $productCode) {
        name
        version
      }
    }
  `,
    variables: { productCode },
  });

  logger.info(`API Response: Getting terms version for ${productCode}`, {
    apiResponse: result,
  });

  const { termsAndConditionsForProduct } = schemaTermsVersion.parse(result);

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

  const result = await graphqlRequest({
    query: `
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
  `,
    variables: {
      input: { accountNumber, mpan, productCode, targetAgreementChangeDate: changeDate },
    },
    headers: {
      authorization: token,
    },
  });

  logger.info('API Response: Starting tariff switch request for StartOnboardingProcess', {
    data: {
      productCode,
      argetAgreementChangeDate: changeDate,
    },
    apiResponse: result,
  });

  const { startOnboardingProcess } = schemaStartOnboardingProcess.parse(result);

  // Octopus reports onboarding failures as data (possibleErrors) with a null
  // productEnrolment, rather than a top-level GraphQL error, so check it here.
  if (startOnboardingProcess.possibleErrors?.length) {
    const details = startOnboardingProcess.possibleErrors
      .map(({ code, message }) => `${code}: ${message}`)
      .join('; ');

    throw new OnboardingError(`Unable to start onboarding process: ${details}`);
  }

  if (!startOnboardingProcess.productEnrolment) {
    throw new OnboardingError('Onboarding process did not return a product enrolment id');
  }

  return startOnboardingProcess.productEnrolment.id;
}

export async function acceptTermsAndConditions({
  accountNumber,
  enrolmentId,
  versionMajor,
  versionMinor,
}: {
  accountNumber: string;
  enrolmentId: string;
  versionMajor: number;
  versionMinor: number;
}) {
  const token = await fetchToken();

  logger.info('API: Starting mutation AcceptTermsAndConditions', {
    data: {
      versionMajor,
      versionMinor,
    },
  });

  const result = await graphqlRequest({
    query: `
    mutation AcceptTermsAndConditions($input: AcceptTermsAndConditionsInput!) {
      acceptTermsAndConditions(input: $input) {
        acceptedVersion
      }
    }
  `,
    variables: {
      input: {
        accountNumber,
        enrolmentId,
        termsVersion: {
          versionMajor,
          versionMinor,
        },
      },
    },
    headers: {
      authorization: token,
    },
  });

  logger.info('API Response: AcceptTermsAndConditions', {
    data: {
      versionMajor,
      versionMinor,
    },
    apiResponse: result,
  });

  const results = schemaAcceptTsAndCs.parse(result);

  return results.acceptTermsAndConditions.acceptedVersion;
}
