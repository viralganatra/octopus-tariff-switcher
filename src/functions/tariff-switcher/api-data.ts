import { formatISO } from 'date-fns';
import { UnknownProductError } from '../../errors/unknown-product-error';
import { UnknownTariffError } from '../../errors/unknown-tariff-error';
import { getMsFromApiIsoString, roundTo4Digits } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import type { TariffSelector, TariffSelectorWithUrl } from '../../types/tariff';
import { TARIFFS } from '../../constants/tariff';
import {
  fetchAccountInfo,
  fetchAllProducts,
  fetchProductDetails,
  fetchSmartMeterTelemetry,
  fetchTodaysUnitRatesByTariff,
  fetchToken,
} from './queries';

let token: string;

type TariffDisplayName = (typeof TARIFFS)[number]['displayName'];

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

  const currentTariff = TARIFFS.find(({ tariffCodeMatcher }) =>
    tariffCode.includes(tariffCodeMatcher),
  );

  if (!currentTariff) {
    throw new UnknownTariffError(`Your current tariff: ${tariffCode} isn't currently supported`);
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

export async function getTodaysUnitRatesByTariff(params: TariffSelectorWithUrl) {
  const results = await fetchTodaysUnitRatesByTariff(params);

  let message: string;

  if ('url' in params) {
    message = `Getting todays unit rates url: ${params.url}`;
  } else {
    message = `Getting todays unit rates for tariff code: ${params.tariffCode} and product code: ${params.productCode}`;
  }

  logger.info(message, {
    apiResponse: results[0],
  });

  const unitRatesWithMs = results.map(({ value_inc_vat, ...halfHourlyUnitRate }) => ({
    ...halfHourlyUnitRate,
    validFromMs: getMsFromApiIsoString(halfHourlyUnitRate.valid_from),
    validToMs: getMsFromApiIsoString(halfHourlyUnitRate.valid_to),
    unitCostInPence: value_inc_vat,
  }));

  return unitRatesWithMs;
}

export async function getPotentialRatesAndStandingChargeByTariff({
  regionCode,
  tariff,
}: {
  regionCode: string;
  tariff: TariffDisplayName;
}) {
  logger.info(`Getting todays rates for tariff: ${tariff} in region: ${regionCode}`);

  const allProducts = await fetchAllProducts();

  // Find the Octopus product for the tariff we're looking for
  const product = allProducts.find((product) => {
    return product.display_name === tariff && product.direction === 'IMPORT';
  });

  if (!product) {
    throw new UnknownProductError(`Unable to find valid product using: ${tariff}`);
  }

  logger.info(`Found matching product based on ${tariff}`, {
    data: product,
  });

  // Find the self link for tariff details
  const productLink = product.links.find((item) => item.rel === 'self')?.href;

  if (!productLink) {
    throw new UnknownProductError('Unable to find self link for product');
  }

  // Fetch tariff details
  const tariffDetails = await fetchProductDetails({ url: productLink });

  const regionCodeKey = `_${regionCode}`;
  const filteredRegion = tariffDetails.single_register_electricity_tariffs[regionCodeKey];

  if (!filteredRegion) {
    throw new UnknownProductError(`Region code not found in product: ${regionCodeKey}`);
  }

  const regionTariffs = filteredRegion.direct_debit_monthly || filteredRegion.varying;
  const standingChargeIncVat = regionTariffs?.standing_charge_inc_vat;

  if (!standingChargeIncVat) {
    throw new UnknownProductError(
      `Standing charge including VAT not found for region: ${regionCodeKey}.`,
    );
  }

  // Find the link for standard unit rates
  const unitRatesLink = regionTariffs.links.find(
    (item) => item.rel === 'standard_unit_rates',
  )?.href;

  if (!unitRatesLink) {
    throw new UnknownProductError(
      `Standard unit rates link not found for region: ${regionCodeKey}`,
    );
  }

  const potentialUnitRates = await getTodaysUnitRatesByTariff({ url: unitRatesLink });

  return {
    potentialUnitRates,
    potentialStandingCharge: roundTo4Digits(standingChargeIncVat),
    potentialProductCode: product.code,
  };
}
