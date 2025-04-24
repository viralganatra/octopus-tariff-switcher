import { MatchingRateError } from '../../errors/matching-rate-error';
import { roundTo4Digits } from '../../utils/helpers';
import type { ConsumptionUnitRates, TariffUnitRates } from './schema';

type UnitCostInPence = Pick<ConsumptionUnitRates[number], 'unitCostInPence'>;
type StandingCharge = number;

export type ConsumptionUnitRatesWithoutCost = Omit<
  ConsumptionUnitRates[number],
  'unitCostInPence'
>[];

export function getTotalCost({
  unitRates,
  standingCharge,
}: {
  unitRates: UnitCostInPence[];
  standingCharge: StandingCharge;
}) {
  let totalConsumptionInPence = 0;

  // Gather total consumption for the day based upon the half hourly intervals
  for (const unitRate of unitRates) {
    totalConsumptionInPence += unitRate.unitCostInPence;
  }

  return roundTo4Digits(totalConsumptionInPence + standingCharge);
}

export function getUnitRatesWithCost({
  consumptionUnitRates,
  tariffUnitRates,
}: {
  consumptionUnitRates: ConsumptionUnitRatesWithoutCost;
  tariffUnitRates: TariffUnitRates;
}) {
  const unitRatesWithCost = consumptionUnitRates.map((halfHourlyUnitRate) => {
    const { readAtMs, readAt, consumptionDelta } = halfHourlyUnitRate;

    const matchingRate = tariffUnitRates.find((rate) => {
      return rate.validFromMs <= readAtMs && readAtMs <= rate.validToMs;
    });

    if (!matchingRate) {
      throw new MatchingRateError(`Unable to find matching rate for: ${readAt}`);
    }

    const consumptionKwh = consumptionDelta / 1000;
    const costPerUnitRate = consumptionKwh * matchingRate.unitCostInPence;

    return {
      ...halfHourlyUnitRate,
      unitCostInPence: roundTo4Digits(costPerUnitRate),
    };
  });

  return unitRatesWithCost;
}

export function getDailyUsageCostByTariff({
  standingCharge,
  consumptionUnitRates,
  tariffUnitRates,
}: {
  standingCharge: StandingCharge;
  consumptionUnitRates: ConsumptionUnitRatesWithoutCost;
  tariffUnitRates: TariffUnitRates;
}) {
  const unitRatesWithCost = getUnitRatesWithCost({
    consumptionUnitRates,
    tariffUnitRates,
  });

  const potentialCost = getTotalCost({
    standingCharge,
    unitRates: unitRatesWithCost,
  });

  return potentialCost;
}
