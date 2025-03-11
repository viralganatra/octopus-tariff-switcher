import { formatISO } from 'date-fns';
import { UnknownProductError } from '../../errors/unknown-product-error';
import { UnknownTariffError } from '../../errors/unknown-tariff-error';
import { getMsFromApiIsoString, roundTo4Digits } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import {
  fetchAccountInfo,
  fetchAllProducts,
  fetchSmartMeterTelemetry,
  fetchTodaysStandingCharge,
  fetchTodaysUnitRatesByTariff,
  fetchToken,
} from './queries';
import type { TariffSelector } from '../../types/tariff';

const [TARIFF_AGILE, TARIFF_COSY] = ['Agile Octopus', 'Cosy Octopus'] as const;
const [TARIFF_CODE_AGILE, TARIFF_CODE_COSY] = ['AGILE-', 'COSY-'] as const;

type Tariff = typeof TARIFF_AGILE | typeof TARIFF_COSY;

let token: string;

export function getOppositeTariff(currentTariff: Tariff) {
  return currentTariff === TARIFF_AGILE ? TARIFF_COSY : TARIFF_AGILE;
}

export async function getToken() {
  if (token) {
    return token;
  }

  logger.info('Getting token from API');

  const data = await fetchToken();

  token = data.obtainKrakenToken.token;

  return token;
}

export async function getAccountInfo() {
  const token = await getToken();
  const results = await fetchAccountInfo({ token });

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

  const { smartMeterTelemetry } = await fetchSmartMeterTelemetry({
    token,
    startDate,
    endDate,
    deviceId,
  });

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

export async function getTodaysUnitRatesByTariff({ tariffCode, productCode }: TariffSelector) {
  const results = await fetchTodaysUnitRatesByTariff({ tariffCode, productCode });

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
  const results = await fetchTodaysStandingCharge({ tariffCode, productCode });

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

  const allProducts = await fetchAllProducts();

  // Find the Octopus product for the tariff we're looking for
  const currentProduct = allProducts.find((product) => {
    return product.display_name === tariff && product.direction === 'IMPORT';
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
