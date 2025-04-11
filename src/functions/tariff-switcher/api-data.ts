import { format, formatISO, isToday, startOfToday } from 'date-fns';
import { Resource } from 'sst';
import { UnknownProductError } from '../../errors/unknown-product-error';
import { UnknownTariffError } from '../../errors/unknown-tariff-error';
import {
  getDateFromApiIsoString,
  getDateInLocalTimeZone,
  getMsFromApiIsoString,
  roundTo4Digits,
  sleep,
} from '../../utils/helpers';
import { logger } from '../../utils/logger';
import { TARIFFS } from '../../constants/tariff';
import {
  acceptTermsAndConditions,
  fetchAccountInfo,
  fetchAllProducts,
  fetchProductDetails,
  fetchSmartMeterTelemetry,
  fetchTermsVersion,
  fetchUnitRatesByTariff,
  startOnboardingProcess,
} from './queries';
import type { UnitRatesTariffSelector } from '../../types/tariff';
import type { IsoDateTime } from '../../types/misc';

type TariffDisplayName = (typeof TARIFFS)[number]['displayName'];

let timesVerified = 0;

export async function getAccountInfo() {
  const results = await fetchAccountInfo();

  const [electricityAgreement] = results.account.electricityAgreements;
  const { tariffCode, standingCharge, productCode } = electricityAgreement.tariff;

  const { mpan, meters } = electricityAgreement.meterPoint;
  const { smartDevices, serialNumber } = meters[0];
  const [{ deviceId }] = smartDevices;
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
    productCode,
    mpan,
    serialNumber,
    currentStandingCharge: normalisedStandingCharge,
  };
}

export async function getConsumptionInHalfHourlyRates({
  deviceId,
  date = new Date(),
}: {
  deviceId: string;
  date?: Date;
}) {
  const isoDate = formatISO(date, { representation: 'date' });
  const startDate = `${isoDate}T00:00:00Z` as IsoDateTime;
  const endDate = `${isoDate}T23:59:59Z` as IsoDateTime;

  const { smartMeterTelemetry } = await fetchSmartMeterTelemetry({
    startDate,
    endDate,
    deviceId,
  });

  const data = smartMeterTelemetry.map(({ costDeltaWithTax, ...halfHourlyUnitRate }) => ({
    ...halfHourlyUnitRate,
    unitCostInPence: costDeltaWithTax,
    readAtMs: getMsFromApiIsoString(halfHourlyUnitRate.readAt),
  }));

  return data;
}

export async function getUnitRatesByTariff(params: UnitRatesTariffSelector) {
  const results = await fetchUnitRatesByTariff(params);

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

  const potentialUnitRates = await getUnitRatesByTariff({ url: unitRatesLink });

  return {
    potentialUnitRates,
    potentialStandingCharge: roundTo4Digits(standingChargeIncVat),
    potentialProductCode: product.code,
  };
}

export async function getTermsVersion(productCode: string) {
  const { version } = await fetchTermsVersion(productCode);

  const [major, minor] = version.split('.').map(Number);

  if (major !== undefined && minor !== undefined) {
    return { versionMajor: major, versionMinor: minor };
  }

  throw new Error(`Missing versions in fetching terms & conditions for product: ${version}`);
}

export async function getEnrollmentId({
  mpan,
  targetProductCode,
}: {
  mpan: string;
  targetProductCode: string;
}) {
  const today = startOfToday();
  const changeDate = format(today, 'yyyy-MM-dd');

  const { productEnrolment } = await startOnboardingProcess({
    mpan,
    changeDate,
    accountNumber: Resource.AccNumber.value,
    productCode: targetProductCode,
  });

  return productEnrolment.id;
}

export async function acceptNewAgreement({
  productCode,
  enrolmentId,
}: { productCode: string; enrolmentId: string }) {
  const { versionMajor, versionMinor } = await getTermsVersion(productCode);

  const acceptedVersion = await acceptTermsAndConditions({
    enrolmentId,
    versionMajor,
    versionMinor,
    accountNumber: Resource.AccNumber.value,
  });

  return acceptedVersion;
}

export async function verifyNewAgreement() {
  const accountInfo = await fetchAccountInfo();

  const { electricityAgreements } = accountInfo.account;
  const validFromDate = electricityAgreements
    .map((agreement) => getDateFromApiIsoString(agreement.validFrom))
    .at(0);

  if (!validFromDate) {
    return false;
  }

  const isVerified = isToday(getDateInLocalTimeZone(validFromDate));

  timesVerified += 1;

  // Re-run if it fails
  if (!isVerified && timesVerified < 3) {
    await sleep(20 * 1000);
    return verifyNewAgreement();
  }

  return isVerified;
}
