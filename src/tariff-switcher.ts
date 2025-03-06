import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  getAccountInfo,
  getOppositeTariff,
  getPotentialRatesAndStandingChargeByTariff,
  getTodaysConsumptionInHalfHourlyRates,
} from './functions/tariff-switcher/api-data';
import { getPotentialCost, getTotalCost } from './functions/tariff-switcher/cost-calculator';
import { roundTo2Digits } from './utils/helpers';
import { logger } from './utils/logger';
import { formatResponse } from './utils/format-response';

export async function tariffSwitcher(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);

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

    let message: string;

    if (potentialCostInPounds < todaysConsumptionCostInPounds) {
      message = `Going to switch from ${currentTariff} to ${oppositeTariff}, as today's cost £${todaysConsumptionCostInPounds} is more expensive than £${potentialCostInPounds}`;
    } else {
      message = `Not switching from ${currentTariff} to ${oppositeTariff}, as today's cost £${todaysConsumptionCostInPounds} is cheaper than £${potentialCostInPounds}`;
    }

    logger.info(message);

    return formatResponse(200, { message });
  } catch (error) {
    let message: string;

    if (error instanceof Error) {
      const err = error.toString();

      message = error.message;

      logger.error(err, error);
    } else {
      message = String(error);
    }

    return formatResponse(500, { message });
  }
}
