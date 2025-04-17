import { isWithinInterval, parseISO } from 'date-fns';
import type { IsoDate } from '../../types/misc';
import type { ConsumptionIntervals, EletricityAgreements } from './schema';
import { chunkArray, processBatches } from '../../utils/batch';
import { TARIFFS, type TariffDisplayName } from '../../constants/tariff';
import { getProductByTariff } from '../tariff-switcher/api-data';
import { retryWithExponentialBackoff } from '../../utils/fetch';
import { fetchConsumption, fetchStandingCharge } from './queries';
import { fetchUnitRatesByTariff } from '../tariff-switcher/queries';
import type { TariffUnitRates } from '../tariff-switcher/schema';

type ItemCache = {
  isoDate: IsoDate;
  tariffCode: string;
  tariffName: TariffDisplayName;
  productCode: string;
  standingCharge: number;
  unitRates: TariffUnitRates;
  consumption: ConsumptionIntervals;
};

type ItemCacheBuilder = Pick<ItemCache, 'isoDate' | 'tariffCode' | 'tariffName'> &
  Partial<Omit<ItemCache, 'isoDate' | 'tariffCode' | 'tariffName'>>;

const BATCH_SIZE = 25;

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

export async function enrichDatesWithTariffData({
  dates,
  pastTariffs,
  mpan,
  serialNumber,
}: { dates: IsoDate[]; pastTariffs: EletricityAgreements; mpan: string; serialNumber: string }) {
  const itemCacheBuilder = new Map<IsoDate, ItemCacheBuilder>();
  const batchesOfDates = chunkArray(dates, BATCH_SIZE);

  // Build initial cache directly
  for (const isoDate of dates) {
    const { tariffCode } = findMatchingTariffForDate({ pastTariffs, isoDate });

    const tariff = TARIFFS.find(({ tariffCodeMatcher }) => tariffCode.includes(tariffCodeMatcher));

    if (!tariff) {
      throw new Error(`No matching tariff for: ${tariffCode}`);
    }

    itemCacheBuilder.set(isoDate, {
      isoDate,
      tariffCode,
      tariffName: tariff.displayName,
    });
  }

  // Fetch product codes for unique tariff names
  const uniqueTariffNames = new Set<ItemCache['tariffName']>();

  for (const item of itemCacheBuilder.values()) {
    uniqueTariffNames.add(item.tariffName);
  }

  const tariffToProduct = new Map<ItemCache['tariffName'], string>();

  await Promise.all(
    [...uniqueTariffNames].map(async (tariffName) => {
      const { code } = await getProductByTariff(tariffName);

      tariffToProduct.set(tariffName, code);
    }),
  );

  // Add product codes to cache
  for (const [isoDate, item] of itemCacheBuilder) {
    const productCode = tariffToProduct.get(item.tariffName);

    itemCacheBuilder.set(isoDate, { ...item, productCode });
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
  const itemCache = new Map<IsoDate, ItemCache>();

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
