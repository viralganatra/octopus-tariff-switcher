import { isWithinInterval, parseISO } from 'date-fns';
import type { IsoDate } from '../../types/misc';
import type { ConsumptionIntervals, EletricityAgreements } from './schema';
import { chunkArray, processBatches } from '../../utils/batch';
import { TARIFFS, type TariffDisplayName } from '../../constants/tariff';
import { retryWithExponentialBackoff } from '../../utils/fetch';
import { fetchConsumption, fetchStandingCharge } from './queries';
import { fetchUnitRatesByTariff } from '../tariff-switcher/queries';
import type { TariffUnitRates } from '../tariff-switcher/schema';

export type TariffData = {
  isoDate: IsoDate;
  tariffCode: string;
  tariffName: TariffDisplayName;
  productCode: string;
  standingCharge: number;
  unitRates: TariffUnitRates;
  consumption: ConsumptionIntervals;
};

export type TariffDataMap = Map<IsoDate, TariffData>;

type ItemCacheBuilder = Pick<TariffData, 'isoDate' | 'tariffCode' | 'tariffName' | 'productCode'> &
  Partial<Omit<TariffData, 'isoDate' | 'tariffCode' | 'tariffName' | 'productCode'>>;

const BATCH_SIZE = 5;

export function findMatchingTariffForDate({
  pastTariffs,
  isoDate,
}: {
  pastTariffs: EletricityAgreements;
  isoDate: IsoDate;
}) {
  const targetDate = parseISO(isoDate);

  // Normalize target to start of day UTC
  const targetDateUtc = new Date(
    Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()),
  );

  const matchingTariff = pastTariffs.find(({ validFrom, validTo }) => {
    const from = parseISO(validFrom);
    const to = parseISO(validTo);

    // isWithinInterval treats end as inclusive so we need to make it exclusive
    return (
      isWithinInterval(targetDateUtc, {
        start: from,
        end: to,
      }) && targetDateUtc.getTime() !== to.getTime()
    );
  });

  if (!matchingTariff) {
    throw new Error(`Unable to find matching tariff for date: ${isoDate}`);
  }

  return matchingTariff;
}

// Find the tariff code is in the format E-1R-COSY-22-12-08-A, extract COSY-22-12-08
// This isn't ideal, but there is no API endpoint that allows us to get a product code
// from a tariff code. Using the products endpoint with an available_at param doesn't work
// as you can be on an older tariff for a given date
function findProductCodeByTariffCode(tariffCode: string) {
  const regex = /(?:E-\dR-)(.*?)(?:-[A-Z])?$/;

  const parts = regex.exec(tariffCode);

  if (!parts || !parts[1]) {
    throw new Error(`No product code found from tariff code: ${tariffCode}`);
  }

  return parts[1];
}

export async function enrichDatesWithTariffData({
  dates,
  pastTariffs,
  mpan,
  serialNumber,
}: {
  dates: IsoDate[];
  pastTariffs: EletricityAgreements;
  mpan: string;
  serialNumber: string;
}) {
  const itemCacheBuilder = new Map<IsoDate, ItemCacheBuilder>();
  const batchesOfDates = chunkArray(dates, BATCH_SIZE);

  // Build initial cache directly
  for (const isoDate of dates) {
    const { tariffCode } = findMatchingTariffForDate({ pastTariffs, isoDate });
    const productCode = findProductCodeByTariffCode(tariffCode);

    const tariff = TARIFFS.find(({ tariffCodeMatcher }) => tariffCode.includes(tariffCodeMatcher));

    if (!tariff) {
      throw new Error(`No matching tariff for: ${tariffCode}`);
    }

    itemCacheBuilder.set(isoDate, {
      isoDate,
      tariffCode,
      productCode,
      tariffName: tariff.displayName,
    });
  }

  // Fetch standing charge, unit rates & consumption in parallel batches
  const unitAndStandingChargesForDates = await processBatches({
    batches: batchesOfDates,
    processBatchItem: (isoDate) =>
      retryWithExponentialBackoff(async () => {
        const item = itemCacheBuilder.get(isoDate);

        if (!item || !item.productCode) {
          throw new Error(`Missing item or productCode for date: ${isoDate}`);
        }

        const { tariffCode, productCode } = item;

        const [standingCharge, unitRates, consumption] = await Promise.all([
          fetchStandingCharge({ isoDate, tariffCode, productCode }),
          fetchUnitRatesByTariff({ isoDate, tariffCode, productCode }),
          fetchConsumption({ isoDate, mpan, serialNumber }),
        ]);

        return { isoDate, standingCharge, unitRates, consumption };
      }),
  });

  // Populate item cache with standing charge, unit rates & consumption
  const itemCache: TariffDataMap = new Map();

  for (const {
    isoDate,
    standingCharge,
    unitRates,
    consumption,
  } of unitAndStandingChargesForDates) {
    const item = itemCacheBuilder.get(isoDate);

    if (!item || !item.productCode) {
      throw new Error(`Missing cache item for date: ${isoDate}`);
    }

    itemCache.set(isoDate, {
      isoDate,
      standingCharge,
      unitRates,
      consumption,
      tariffCode: item.tariffCode,
      tariffName: item.tariffName,
      productCode: item.productCode,
    });
  }

  return itemCache;
}
