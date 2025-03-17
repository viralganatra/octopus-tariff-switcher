import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  getAccountInfo,
  getPotentialRatesAndStandingChargeByTariff,
  getTodaysConsumptionInHalfHourlyRates,
} from './functions/tariff-switcher/api-data';
import { getPotentialCost, getTotalCost } from './functions/tariff-switcher/cost-calculator';
import { penceToPoundWithCurrency } from './utils/helpers';
import { logger } from './utils/logger';
import { formatResponse } from './utils/format-response';
import { TARIFFS } from './constants/tariff';
import { sendEmail } from './notifications/email';

async function logAndFormatSuccessMessage(message: string) {
  logger.info(message);

  return formatResponse(200, { message });
}

export async function tariffSwitcher(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);

  try {
    const { deviceId, currentStandingCharge, regionCode, currentTariff } = await getAccountInfo();

    const todaysConsumptionUnitRates = await getTodaysConsumptionInHalfHourlyRates({ deviceId });

    const todaysConsumptionCost = getTotalCost({
      unitRates: todaysConsumptionUnitRates,
      standingCharge: currentStandingCharge,
    });

    const todaysConsumptionCostInPounds = penceToPoundWithCurrency(todaysConsumptionCost);

    const currentTariffWithCost = { ...currentTariff, cost: todaysConsumptionCost };
    const allTariffCosts = [currentTariffWithCost];

    for (const tariff of TARIFFS) {
      if (tariff.id === currentTariff.id) {
        continue;
      }

      const { potentialUnitRates, potentialStandingCharge } =
        await getPotentialRatesAndStandingChargeByTariff({
          regionCode,
          tariff: tariff.displayName,
        });

      const potentialCost = getPotentialCost({
        todaysConsumptionUnitRates,
        todaysPotentialStandingCharge: potentialStandingCharge,
        todaysPotentialUnitRates: potentialUnitRates,
      });

      allTariffCosts.push({ ...tariff, cost: potentialCost });
    }

    // Find cheapest tariff
    const allTariffsByCost = allTariffCosts.toSorted((a, b) => a.cost - b.cost);

    logger.info('All tariffs by cost', {
      data: allTariffCosts,
    });

    const cheapestTariff = allTariffsByCost.at(0) ?? currentTariffWithCost;
    const cheapestTariffCostInPounds = penceToPoundWithCurrency(cheapestTariff.cost);

    if (cheapestTariff.id === currentTariff.id) {
      await sendEmail({
        allTariffsByCost,
        currentTariffWithCost,
        emailType: 'ALREADY_ON_CHEAPEST_TARIFF',
      });

      return logAndFormatSuccessMessage(
        `You are already on the cheapest tariff: ${cheapestTariff.displayName} - ${todaysConsumptionCostInPounds}`,
      );
    }

    const savings = todaysConsumptionCost - cheapestTariff.cost;

    // Not worth switching for 2p
    if (savings > 2) {
      await sendEmail({
        allTariffsByCost,
        currentTariffWithCost,
        emailType: 'CHEAPER_TARIFF_EXISTS',
      });

      return logAndFormatSuccessMessage(
        `Going to switch to ${cheapestTariff.displayName} - ${cheapestTariffCostInPounds} from ${currentTariff.displayName} - ${todaysConsumptionCostInPounds}`,
      );
    }

    await sendEmail({
      allTariffsByCost,
      currentTariffWithCost,
      emailType: 'NOT_WORTH_SWITCHING_TARIFF',
    });

    return logAndFormatSuccessMessage(
      `Not worth switching to ${cheapestTariff.displayName} from ${currentTariff.displayName}`,
    );
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
