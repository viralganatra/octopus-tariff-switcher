import {
  getAccountInfo,
  getOppositeTariff,
  getPotentialRatesAndStandingChargeByTariff,
  getTodaysConsumptionInHalfHourlyRates,
} from './functions/tariff-switcher/api-data';
import { getPotentialCost, getTotalCost } from './functions/tariff-switcher/cost-calculator';
import { roundTo2Digits } from './utils/helpers';
import { logger } from './utils/logger';

export async function tariffSwitcher() {
  try {
    const { deviceId, currentStandingCharge, regionCode, currentTariff } = await getAccountInfo();
    const oppositeTariff = getOppositeTariff(currentTariff);

    const [todaysConsumptionUnitRates, { potentialUnitRates, potentialStandingCharge }] =
      await Promise.all([
        getTodaysConsumptionInHalfHourlyRates({ deviceId }),
        getPotentialRatesAndStandingChargeByTariff({
          regionCode,
          tariff: oppositeTariff,
        }),
      ]);

    const todaysConsumptionCost = getTotalCost({
      unitRates: todaysConsumptionUnitRates,
      standingCharge: currentStandingCharge,
    });

    const potentialCost = getPotentialCost({
      potentialStandingCharge,
      todaysConsumptionUnitRates,
      todaysPotentialUnitRates: potentialUnitRates,
    });

    const todaysConsumptionCostInPounds = roundTo2Digits(todaysConsumptionCost / 100).toFixed(2);
    // Add 2p buffer as not worth switching
    const potentialCostInPounds = roundTo2Digits((potentialCost + 2) / 100).toFixed(2);

    if (potentialCostInPounds < todaysConsumptionCostInPounds) {
      logger.info(
        `Going to switch from ${currentTariff} to ${oppositeTariff}, as today's cost £${todaysConsumptionCostInPounds} is more expensive than £${potentialCostInPounds}`,
      );
    } else {
      logger.info(
        `Not switching from ${currentTariff} to ${oppositeTariff}, as today's cost £${todaysConsumptionCostInPounds} is cheaper than £${potentialCostInPounds}`,
      );
    }

    return potentialCostInPounds < todaysConsumptionCostInPounds;
  } catch (error) {
    logger.error('Error', error as Error);

    throw error;
  }
}
