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
  getDailyCostInPence,
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

function logSuccessAndRespond(successMessage: string) {
  const message = isDryRun() ? `DRY RUN: ${successMessage}` : successMessage;

  logger.info(message);

  return formatResponse(200, { message });
}

function sendTariffEmail(params: SendEmail) {
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

    const todayCostInPence = getDailyCostInPence({
      unitRates: todaysConsumptionUnitRates,
      standingCharge: currentStandingCharge,
    });

    const todaysCostInPounds = penceToPoundWithCurrency(todayCostInPence);

    logger.info(`Today's consumption cost is ${todaysCostInPounds}`);

    const currentTariffWithCost = {
      ...currentTariff,
      productCode,
      costInPence: todayCostInPence,
    };

    const comparedTariffs = [currentTariffWithCost];

    for (const tariff of TARIFFS) {
      if (tariff.id === currentTariff.id) {
        continue;
      }

      const { potentialUnitRates, potentialStandingCharge, potentialProductCode } =
        await getPotentialRatesAndStandingChargeByTariff({
          regionCode,
          tariff: tariff.displayName,
        });

      const potentialCostInPence = getDailyUsageCostByTariff({
        consumptionUnitRates: todaysConsumptionUnitRates,
        standingCharge: potentialStandingCharge,
        tariffUnitRates: potentialUnitRates,
      });

      comparedTariffs.push({
        ...tariff,
        costInPence: potentialCostInPence,
        productCode: potentialProductCode,
      });
    }

    // Find cheapest tariff
    const sortedTariffsByCost = comparedTariffs.toSorted((a, b) => a.costInPence - b.costInPence);

    logger.info('All tariffs by cost', {
      data: comparedTariffs,
    });

    const cheapestTariff = sortedTariffsByCost.at(0) ?? currentTariffWithCost;
    const cheapestTariffCostInPounds = penceToPoundWithCurrency(cheapestTariff.costInPence);

    if (cheapestTariff.id === currentTariff.id) {
      await sendTariffEmail({
        allTariffsByCost: sortedTariffsByCost,
        currentTariffWithCost,
        emailType: 'ALREADY_ON_CHEAPEST_TARIFF',
      });

      return logSuccessAndRespond(
        `You are already on the cheapest tariff: ${cheapestTariff.displayName} - ${todaysCostInPounds}`,
      );
    }

    const savingsInPence = todayCostInPence - cheapestTariff.costInPence;

    // Not worth switching for 2p
    if (savingsInPence <= 2) {
      await sendTariffEmail({
        allTariffsByCost: sortedTariffsByCost,
        currentTariffWithCost,
        emailType: 'NOT_WORTH_SWITCHING_TARIFF',
      });

      return logSuccessAndRespond(
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

    await sendTariffEmail({
      allTariffsByCost: sortedTariffsByCost,
      currentTariffWithCost,
      emailType: 'CHEAPER_TARIFF_EXISTS',
    });

    return logSuccessAndRespond(
      `Going to switch to ${cheapestTariff.displayName} - ${cheapestTariffCostInPounds} from ${currentTariff.displayName} - ${todaysCostInPounds}`,
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
