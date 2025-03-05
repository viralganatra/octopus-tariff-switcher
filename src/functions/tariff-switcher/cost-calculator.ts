import { MatchingRateError } from '../../errors/matching-rate-error';
import { roundTo4Digits } from '../../utils/helpers';

type UnitCostInPence = {
  unitCostInPence: number;
};

type ConsumptionUnitRates = (UnitCostInPence & {
  readAtMs: number;
  readAt: string;
  consumptionDelta: number;
})[];

type PotentialUnitRates = {
  validFromMs: number;
  validToMs: number;
  unitCostInPence: number;
  valid_from: string;
  valid_to: string;
}[];

type StandingCharge = number;

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

export function getPotentialCost({
  potentialStandingCharge,
  todaysConsumptionUnitRates,
  todaysPotentialUnitRates,
}: {
  potentialStandingCharge: StandingCharge;
  todaysConsumptionUnitRates: ConsumptionUnitRates;
  todaysPotentialUnitRates: PotentialUnitRates;
}) {
  const potentialUnitCosts = todaysConsumptionUnitRates.map((halfHourlyUnitRate) => {
    const { readAtMs, readAt, consumptionDelta } = halfHourlyUnitRate;

    const matchingRate = todaysPotentialUnitRates.find((rate) => {
      return rate.validFromMs < readAtMs && readAtMs <= rate.validToMs;
    });

    if (!matchingRate) {
      throw new MatchingRateError(`Unable to find matching rate for: ${readAt}`);
    }

    const consumptionKwh = consumptionDelta / 1000;
    const costPerUnitRate = consumptionKwh * matchingRate.unitCostInPence;

    return {
      unitCostInPence: roundTo4Digits(costPerUnitRate),
    };
  });

  const potentialCost = getTotalCost({
    unitRates: potentialUnitCosts,
    standingCharge: potentialStandingCharge,
  });

  return potentialCost;
}
