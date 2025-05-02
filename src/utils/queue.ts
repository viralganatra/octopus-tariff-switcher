import {
  SendMessageBatchCommand,
  SQSClient,
  type SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { Resource } from 'sst';
import { TARIFFS } from '../constants/tariff';
import type { TariffDataMap } from '../functions/publish-historical-tariff-data/api-data';
import type { IsoDate } from '../types/misc';
import { batchWithRetry } from './fetch';

const BATCH_SIZE = 10;
const client = new SQSClient();

export function buildQueueEntries(items: TariffDataMap) {
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

export function sendQueueEntriesInBatches(entries: SendMessageBatchRequestEntry[]) {
  return batchWithRetry({
    entries,
    batchSize: BATCH_SIZE,
    sendBatch: async (batch) => {
      const response = await client.send(
        new SendMessageBatchCommand({
          QueueUrl: Resource.OctopusTariffSwitcherWriteQueue.url,
          Entries: batch,
        }),
      );

      const failedIds = new Set((response.Failed ?? []).map((f) => f.Id));
      const failedEntries = batch.filter((entry) => failedIds.has(entry.Id));
      const failedIsoDates = failedEntries
        .map(({ MessageBody }) =>
          MessageBody ? (JSON.parse(MessageBody) as { isoDate: IsoDate }).isoDate : null,
        )
        .filter(Boolean)
        .join(', ');

      const failedReason = failedIsoDates ? `Failed SQS messages: ${failedIsoDates}` : '';

      return {
        failed: failedEntries,
        reason: failedReason,
      };
    },
  });
}
