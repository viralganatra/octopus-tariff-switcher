import { Resource } from 'sst';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  SendMessageBatchCommand,
  SQSClient,
  type SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { eachDayOfInterval, formatISO, parseISO, subDays } from 'date-fns';
import { getAccountInfo } from './functions/tariff-switcher/api-data';
import { fetchAllPastTariffs } from './functions/backfill-message-publisher/queries';
import { enrichDatesWithTariffData } from './functions/backfill-message-publisher/api-data';
import { logger } from './utils/logger';
import { toIsoDateString } from './utils/helpers';
import type { IsoDate } from './types/misc';
import { formatResponse } from './utils/format-response';
import { TARIFFS } from './constants/tariff';
import { retryWithExponentialBackoff } from './utils/fetch';

const BATCH_SIZE = 10;
const client = new SQSClient();

function listIsoDatesUntilYesterday(startDateISO: IsoDate) {
  const start = parseISO(startDateISO);
  // Exclude today
  const end = subDays(new Date(), 1);

  return eachDayOfInterval({ start, end }).map((date) =>
    toIsoDateString(formatISO(date, { representation: 'date' })),
  );
}

function buildQueueEntries(items: Awaited<ReturnType<typeof enrichDatesWithTariffData>>) {
  const queueEntries: SendMessageBatchRequestEntry[] = [];
  let msgCounter = 0;

  for (const item of items.values()) {
    const tariff = TARIFFS.find(({ tariffCodeMatcher }) =>
      item.tariffCode.includes(tariffCodeMatcher),
    );

    if (!tariff) {
      throw new Error(`No matching tariff for: ${item.tariffCode}`);
    }

    queueEntries.push({
      Id: `msg-${msgCounter++}`,
      MessageBody: JSON.stringify({ ...item, id: tariff.id }),
      MessageGroupId: process.env.SERVICE_ID,
      MessageDeduplicationId: item.isoDate,
    });
  }

  return queueEntries;
}

async function sendQueueEntriesInBatches(entries: SendMessageBatchRequestEntry[]) {
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    await retryWithExponentialBackoff(async () => {
      const response = await client.send(
        new SendMessageBatchCommand({
          QueueUrl: Resource.OctopusTariffSwitcherWriteFifoQueue.url,
          Entries: batch,
        }),
      );

      const failed = response.Failed ?? [];

      if (failed.length === 0) {
        return;
      }

      const failedIds = new Set(failed.map((f) => f.Id));
      const failedEntries = batch.filter((entry) => failedIds.has(entry.Id));

      const failedIsoDates = failedEntries.map(({ MessageBody }) => {
        if (MessageBody) {
          const { isoDate } = JSON.parse(MessageBody) as { isoDate: string };
          return isoDate;
        }
      });

      logger.warn(`Retrying ${failedEntries.length} failed messages`);
      // Replace the original batch with failed messages for retry
      batch.length = 0;
      batch.push(...failedEntries);

      throw new Error(`Some messages failed to send: ${failedIsoDates.join(', ')}`);
    });
  }
}

export async function publishBackfillMessages(
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

    const dates = listIsoDatesUntilYesterday(toIsoDateString(process.env.BACKFILL_FROM_DATE));
    const enrichedDates = await enrichDatesWithTariffData({
      dates,
      pastTariffs,
      mpan,
      serialNumber,
    });

    const queueEntries = buildQueueEntries(enrichedDates);
    await sendQueueEntriesInBatches(queueEntries);

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
