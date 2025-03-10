import { formatISO } from 'date-fns';
import { Graffle } from 'graffle';
import { z } from 'zod';
import { Resource } from 'sst';
import { API_GRAPHQL, API_PRODUCTS } from '../../constants/api';
import { UnknownProductError } from '../../errors/unknown-product-error';
import { UnknownTariffError } from '../../errors/unknown-tariff-error';
import { getData } from '../../utils/fetch';
import { getMsFromApiIsoString, roundTo4Digits } from '../../utils/helpers';
import { logger } from '../../utils/logger';

const [TARIFF_AGILE, TARIFF_COSY] = ['Agile Octopus', 'Cosy Octopus'] as const;
const [TARIFF_CODE_AGILE, TARIFF_CODE_COSY] = ['AGILE-', 'COSY-'] as const;

type Tariff = typeof TARIFF_AGILE | typeof TARIFF_COSY;

type TariffSelector = {
  tariffCode: string;
  productCode: string;
};

let token: string;

export function getOppositeTariff(currentTariff: Tariff) {
  return currentTariff === TARIFF_AGILE ? TARIFF_COSY : TARIFF_AGILE;
}

export async function getToken() {
  if (token) {
    return token;
  }

  logger.info('Getting token from API');

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

  const data = schema.parse(result);

  token = data.obtainKrakenToken.token;

  return token;
}

export async function getAccountInfo() {
  const token = await getToken();

  const schema = z.object({
    account: z.object({
      electricityAgreements: z
        .array(
          z.object({
            validFrom: z.string().datetime({ offset: true }),
            validTo: z.string().nullable(),
            meterPoint: z.object({
              meters: z
                .array(
                  z.object({
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

  const results = schema.parse(result);

  logger.info('Got account info from API', { apiResponse: results });

  const [electricityAgreement] = results.account.electricityAgreements;
  const { tariffCode, standingCharge } = electricityAgreement.tariff;
  const [{ deviceId }] = electricityAgreement.meterPoint.meters[0].smartDevices;
  // tariffCode is in the format E-1R-COSY-22-12-08-A and should always be a non empty string,
  // but typescript casts this to at to string | undefined
  const regionCode = tariffCode.at(-1) as string;
  const normalisedStandingCharge = roundTo4Digits(standingCharge);

  let currentTariff: Tariff;

  if (tariffCode.includes(TARIFF_CODE_AGILE)) {
    currentTariff = TARIFF_AGILE;
  } else if (tariffCode.includes(TARIFF_CODE_COSY)) {
    currentTariff = TARIFF_COSY;
  } else {
    throw new UnknownTariffError(`Current tariff is neither Agile nor Cosy, it is: ${tariffCode}`);
  }

  return {
    currentTariff,
    regionCode,
    deviceId,
    currentStandingCharge: normalisedStandingCharge,
  };
}

export async function getTodaysConsumptionInHalfHourlyRates({
  deviceId,
}: {
  deviceId: string;
}) {
  const token = await getToken();

  const today = formatISO(new Date(), { representation: 'date' });
  const startDate = `${today}T00:30:00Z`;
  const endDate = `${today}T23:59:59Z`;

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

  const { smartMeterTelemetry } = schema.parse(result);

  logger.info('Got half hourly consumption data from API', {
    apiResponse: smartMeterTelemetry,
  });

  const data = smartMeterTelemetry.map(({ costDeltaWithTax, ...halfHourlyUnitRate }) => ({
    ...halfHourlyUnitRate,
    unitCostInPence: costDeltaWithTax,
    readAtMs: getMsFromApiIsoString(halfHourlyUnitRate.readAt),
  }));

  return data;
}

async function getAllProducts() {
  const schema = z.object({
    results: z.array(
      z.object({
        display_name: z.string(),
        direction: z.enum(['IMPORT', 'EXPORT']),
        brand: z.string(),
        code: z.string(),
      }),
    ),
  });

  const data = await getData(`${API_PRODUCTS}?brand=OCTOPUS_ENERGY&is_business=false`);

  const { results } = schema.parse(data);

  return results;
}

export async function getTodaysUnitRatesByTariff({ tariffCode, productCode }: TariffSelector) {
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

  const today = formatISO(new Date(), { representation: 'date' });

  const data = await getData(
    `${API_PRODUCTS}/${tariffCode}/electricity-tariffs/${productCode}/standard-unit-rates/?period_from=${today}T00:00:00Z&period_to=${today}T23:59:59Z`,
  );

  const { results } = schema.parse(data);

  logger.info(
    `Getting todays unit rates for tariff code: ${tariffCode} and product code: ${productCode}`,
    {
      apiResponse: results[0],
    },
  );

  const unitRatesWithMs = results.map(({ value_inc_vat, ...halfHourlyUnitRate }) => ({
    ...halfHourlyUnitRate,
    validFromMs: getMsFromApiIsoString(halfHourlyUnitRate.valid_from),
    validToMs: getMsFromApiIsoString(halfHourlyUnitRate.valid_to),
    unitCostInPence: value_inc_vat,
  }));

  return unitRatesWithMs;
}

async function getTodaysStandingCharge({ tariffCode, productCode }: TariffSelector) {
  const schema = z.object({
    results: z
      .array(
        z.object({
          value_inc_vat: z.number(),
        }),
      )
      .nonempty(),
  });

  const data = await getData(
    `${API_PRODUCTS}/${tariffCode}/electricity-tariffs/${productCode}/standing-charges/`,
  );

  const { results } = schema.parse(data);

  logger.info(
    `Got today's standing charge for tariff code: ${tariffCode} and product code: ${productCode} from API`,
    {
      apiResponse: results,
    },
  );

  const todaysStandingCharge = roundTo4Digits(results[0].value_inc_vat);

  return todaysStandingCharge;
}

export async function getPotentialRatesAndStandingChargeByTariff({
  regionCode,
  tariff,
}: {
  regionCode: string;
  tariff: Tariff;
}) {
  logger.info(`Getting todays rates for tariff: ${tariff} in region: ${regionCode}`);

  const allProducts = await getAllProducts();

  // Find the Octopus product for the tariff we're looking for
  const currentProduct = allProducts.find((product) => {
    return (
      product.display_name === tariff &&
      product.direction === 'IMPORT'
    );
  });

  logger.info(`Found matching product based on ${tariff}`, {
    data: currentProduct,
  });

  // There should always be a product for Agile or Cosy
  if (!currentProduct) {
    throw new UnknownProductError(`Unable to find valid product using: ${tariff}`);
  }

  const tariffCode = currentProduct.code;
  // Residential tariffs are always E-1R
  const productCode = `E-1R-${tariffCode}-${regionCode}`;

  const [potentialUnitRates, potentialStandingCharge] = await Promise.all([
    getTodaysUnitRatesByTariff({ tariffCode, productCode }),
    getTodaysStandingCharge({ tariffCode, productCode }),
  ]);

  return { potentialUnitRates, potentialStandingCharge };
}
