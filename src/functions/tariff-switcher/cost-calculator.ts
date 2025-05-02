import { MatchingRateError } from '../../errors/matching-rate-error';
import { roundTo4Digits } from '../../utils/helpers';
import type { ConsumptionUnitRates, TariffUnitRates } from './schema';
import type { ConsumptionIntervals } from '../publish-historical-tariff-data/schema';

type UnitCostPence = Pick<ConsumptionUnitRates[number], 'unitCostInPence'>;
type StandingChargePence = number;

export function getDailyCostInPence({
  unitRates,
  standingCharge,
}: {
  unitRates: UnitCostPence[];
  standingCharge: StandingChargePence;
}) {
  let costInPence = 0;

  // Gather total consumption for the day based upon the half hourly intervals
  for (const unitRate of unitRates) {
    costInPence += unitRate.unitCostInPence;
  }

  return roundTo4Digits(costInPence + standingCharge);
}

export function getUnitRatesWithCost({
  consumptionUnitRates,
  tariffUnitRates,
}: {
  consumptionUnitRates: ConsumptionIntervals;
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
    const costInPencePerUnitRate = consumptionKwh * matchingRate.unitCostInPence;

    return {
      ...halfHourlyUnitRate,
      unitCostInPence: roundTo4Digits(costInPencePerUnitRate),
    };
  });

  return unitRatesWithCost;
}

export function getDailyUsageCostByTariff({
  standingCharge,
  consumptionUnitRates,
  tariffUnitRates,
}: {
  standingCharge: StandingChargePence;
  consumptionUnitRates: ConsumptionIntervals;
  tariffUnitRates: TariffUnitRates;
}) {
  const unitRatesWithCost = getUnitRatesWithCost({
    consumptionUnitRates,
    tariffUnitRates,
  });

  const dailyCostPence = getDailyCostInPence({
    standingCharge,
    unitRates: unitRatesWithCost,
  });

  return dailyCostPence;
}
