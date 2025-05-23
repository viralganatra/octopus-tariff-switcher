import type { Context, SQSBatchItemFailure, SQSEvent } from 'aws-lambda';
import { logger } from './utils/logger';
import { schemaDailyUsage } from './functions/tariff-data-processor/schema';
import { saveDailyUsage } from './functions/tariff-data-processor/db';

export async function processTariffDataQueue(event: SQSEvent, context: Context) {
  logger.addContext(context);

  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const item = JSON.parse(record.body);
      const dailyUsageItem = schemaDailyUsage.parse(item);

      await saveDailyUsage(dailyUsageItem);

      logger.info(`Daily usage data saved successfully for: ${dailyUsageItem.isoDate}`);
    } catch (error) {
      batchItemFailures.push({ itemIdentifier: record.messageId });

      const message = String(error);

      logger.error('Unhandled error', {
        errorMessage: message,
        originalError: error,
      });
    }
  }

  return { batchItemFailures };
}
