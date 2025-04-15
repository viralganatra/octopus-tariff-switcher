import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  acceptNewAgreement,
  getAccountInfo,
  getEnrollmentId,
  getPotentialRatesAndStandingChargeByTariff,
  getConsumptionInHalfHourlyRates,
  verifyNewAgreement,
} from './functions/tariff-switcher/api-data';
import {
  getDailyUsageCostByTariff,
  getTotalCost,
} from './functions/tariff-switcher/cost-calculator';
import { penceToPoundWithCurrency, sleep } from './utils/helpers';
import { logger } from './utils/logger';
import { formatResponse } from './utils/format-response';
import { TARIFFS } from './constants/tariff';
import { sendEmail } from './notifications/email';
import { AgreementVerificationError } from './errors/agreement-verification-error';
import type { SendEmail } from './types/email';

function isDryRun() {
  return process.env.DRY_RUN === 'true';
}

function logAndFormatSuccessMessage(successMessage: string) {
  const message = isDryRun() ? `DRY RUN: ${successMessage}` : successMessage;

  logger.info(message);

  return formatResponse(200, { message });
}

function sendNotification(params: SendEmail) {
  return isDryRun() ? Promise.resolve() : sendEmail(params);
}

export async function tariffSwitcher(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);

  try {
    const { deviceId, currentStandingCharge, regionCode, currentTariff, productCode, mpan } =
      await getAccountInfo();

    const todaysConsumptionUnitRates = await getConsumptionInHalfHourlyRates({ deviceId });

    logger.info(`Recieved today's consumption unit rates`, {
      data: todaysConsumptionUnitRates,
    });

    const todaysConsumptionCost = getTotalCost({
      unitRates: todaysConsumptionUnitRates,
      standingCharge: currentStandingCharge,
    });

    const todaysConsumptionCostInPounds = penceToPoundWithCurrency(todaysConsumptionCost);

    logger.info(`Today's consumption cost is ${todaysConsumptionCostInPounds}`);

    const currentTariffWithCost = {
      ...currentTariff,
      productCode,
      cost: todaysConsumptionCost,
    };

    const allTariffCosts = [currentTariffWithCost];

    for (const tariff of TARIFFS) {
      if (tariff.id === currentTariff.id) {
        continue;
      }

      const { potentialUnitRates, potentialStandingCharge, potentialProductCode } =
        await getPotentialRatesAndStandingChargeByTariff({
          regionCode,
          tariff: tariff.displayName,
        });

      const potentialCost = getDailyUsageCostByTariff({
        consumptionUnitRates: todaysConsumptionUnitRates,
        standingCharge: potentialStandingCharge,
        tariffUnitRates: potentialUnitRates,
      });

      allTariffCosts.push({ ...tariff, cost: potentialCost, productCode: potentialProductCode });
    }

    // Find cheapest tariff
    const allTariffsByCost = allTariffCosts.toSorted((a, b) => a.cost - b.cost);

    logger.info('All tariffs by cost', {
      data: allTariffCosts,
    });

    const cheapestTariff = allTariffsByCost.at(0) ?? currentTariffWithCost;
    const cheapestTariffCostInPounds = penceToPoundWithCurrency(cheapestTariff.cost);

    if (cheapestTariff.id === currentTariff.id) {
      await sendNotification({
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
    if (savings <= 2) {
      await sendNotification({
        allTariffsByCost,
        currentTariffWithCost,
        emailType: 'NOT_WORTH_SWITCHING_TARIFF',
      });

      return logAndFormatSuccessMessage(
        `Not worth switching to ${cheapestTariff.displayName} from ${currentTariff.displayName}`,
      );
    }

    if (!isDryRun()) {
      const enrolmentId = await getEnrollmentId({
        mpan,
        targetProductCode: cheapestTariff.productCode,
      });

      await sleep(60 * 1000);

      const acceptedVersion = await acceptNewAgreement({
        enrolmentId,
        productCode: cheapestTariff.productCode,
      });

      logger.info(`Accepted new tariff agreement: ${acceptedVersion}`);

      const isVerified = await verifyNewAgreement();

      if (!isVerified) {
        throw new AgreementVerificationError(
          'Unable to verify new agreement after multiple retries. Please check your account and emails.',
        );
      }
    }

    await sendNotification({
      allTariffsByCost,
      currentTariffWithCost,
      emailType: 'CHEAPER_TARIFF_EXISTS',
    });

    return logAndFormatSuccessMessage(
      `Going to switch to ${cheapestTariff.displayName} - ${cheapestTariffCostInPounds} from ${currentTariff.displayName} - ${todaysConsumptionCostInPounds}`,
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
