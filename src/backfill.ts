import { Resource } from 'sst';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  SendMessageBatchCommand,
  SQSClient,
  type SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { eachDayOfInterval, formatISO, parseISO, subDays } from 'date-fns';
import { getAccountInfo } from './functions/tariff-switcher/api-data';
import { fetchAllPastTariffs } from './functions/backfill/queries';
import { enrichDatesWithTariffData } from './functions/backfill/api-data';
import { logger } from './utils/logger';
import { toIsoDateString } from './utils/helpers';
import type { IsoDate } from './types/misc';
import { getDailyUsageCostByTariff } from './functions/tariff-switcher/cost-calculator';
import { formatResponse } from './utils/format-response';
import { TARIFFS } from './constants/tariff';
import { retryWithExponentialBackoff } from './utils/fetch';

const client = new SQSClient();
const BATCH_SIZE = 10;

function getDatesFromUntilYesterday(startDateISO: IsoDate) {
  const start = parseISO(startDateISO);
  // Exclude today
  const end = subDays(new Date(), 1);

  return eachDayOfInterval({ start, end }).map((date) =>
    toIsoDateString(formatISO(date, { representation: 'date' })),
  );
}

function createMessages(items: Awaited<ReturnType<typeof enrichDatesWithTariffData>>) {
  const messages: SendMessageBatchRequestEntry[] = [];
  let counter = 0;

  for (const item of items.values()) {
    const cost = getDailyUsageCostByTariff({
      standingCharge: item.standingCharge,
      consumptionUnitRates: item.consumption,
      tariffUnitRates: item.unitRates,
    });

    const tariff = TARIFFS.find(({ tariffCodeMatcher }) =>
      item.tariffCode.includes(tariffCodeMatcher),
    );

    if (!tariff) {
      throw new Error(`No matching tariff for: ${item.tariffCode}`);
    }

    messages.push({
      Id: `msg-${counter++}`,
      MessageBody: JSON.stringify({ ...item, cost, id: tariff.id }),
    });
  }

  return messages;
}

async function sendMessagesInBatches(entries: SendMessageBatchRequestEntry[]) {
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    await retryWithExponentialBackoff(async () => {
      const response = await client.send(
        new SendMessageBatchCommand({
          QueueUrl: Resource.OctopusTariffWriteQueue.url,
          Entries: batch,
        }),
      );

      const failed = response.Failed ?? [];

      if (failed.length === 0) {
        return;
      }

      const failedIds = new Set(failed.map((f) => f.Id));
      const failedMessages = batch.filter((entry) => failedIds.has(entry.Id));

      const dates = failedMessages.map(({ MessageBody }) => {
        if (MessageBody) {
          const { isoDate } = JSON.parse(MessageBody) as { isoDate: string };
          return isoDate;
        }
      });

      logger.warn(`Retrying ${failedMessages.length} failed messages`);
      // Replace the original batch with failed messages for retry
      batch.length = 0;
      batch.push(...failedMessages);

      throw new Error(`Some messages failed to send: ${dates.join(', ')}`);
    });
  }
}

export async function backfill(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);

  try {
    if (!process.env.BACKFILL_FROM_DATE) {
      throw new Error('BACKFILL_FROM_DATE env variable is not set');
    }

    const [pastTariffs, { mpan, serialNumber }] = await Promise.all([
      fetchAllPastTariffs(),
      getAccountInfo(),
    ]);

    const dates = getDatesFromUntilYesterday(toIsoDateString(process.env.BACKFILL_FROM_DATE));
    const enrichedItems = await enrichDatesWithTariffData({
      dates,
      pastTariffs,
      mpan,
      serialNumber,
    });

    const messages = createMessages(enrichedItems);
    await sendMessagesInBatches(messages);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Backfill data successfully generated and sent to queue',
      }),
    };
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
