import {
  BatchWriteItemCommand,
  DynamoDBClient,
  type AttributeValue,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Resource } from 'sst';
import { format, parseISO } from 'date-fns';
import {
  getDailyUsageCostByTariff,
  getUnitRatesWithCost,
} from '../tariff-switcher/cost-calculator';
import type { TariffData } from '../backfill-message-publisher/api-data';
import { getDateInUTC } from '../../utils/helpers';
import { batchWithRetry } from '../../utils/fetch';
import type { DailyUsage } from './schema';

const BATCH_SIZE = 25;
const client = new DynamoDBClient();

function calculateCost(item: TariffData) {
  return getDailyUsageCostByTariff({
    standingCharge: item.standingCharge,
    consumptionUnitRates: item.consumption,
    tariffUnitRates: item.unitRates,
  });
}

function createWriteRequestsForDay(dailyUsage: DailyUsage) {
  const writeRequests: { PutRequest: { Item: Record<string, AttributeValue> } }[] = [];

  // Individual half‑hour reads
  const unitRatesWithCost = getUnitRatesWithCost({
    tariffUnitRates: dailyUsage.unitRates,
    consumptionUnitRates: dailyUsage.consumption,
  });

  for (const unitRate of unitRatesWithCost) {
    const readAtUTC = getDateInUTC(parseISO(unitRate.readAt));
    const timeKey = format(readAtUTC, 'HH:mm');

    writeRequests.push({
      PutRequest: {
        Item: marshall({
          PK: `DATE#${dailyUsage.isoDate}`,
          SK: `USAGE#${timeKey}`,
          readAt: unitRate.readAt,
          consumptionDelta: unitRate.consumptionDelta,
          costDelta: unitRate.unitCostInPence,
        }),
      },
    });
  }

  // Daily tariff cost
  const dailyTariffCost = calculateCost(dailyUsage);

  writeRequests.push({
    PutRequest: {
      Item: marshall({
        PK: `DATE#${dailyUsage.isoDate}`,
        SK: `TARIFF#${dailyUsage.id}`,
        tariffName: dailyUsage.tariffName,
        tariffId: dailyUsage.id,
        tariffCost: dailyTariffCost,
        tariffStandingCharge: dailyUsage.standingCharge,
      }),
    },
  });

  // Daily consumption total
  let dailyKwhTotal = 0;

  for (const unitConsumption of dailyUsage.consumption) {
    dailyKwhTotal += unitConsumption.consumptionDelta;
  }

  writeRequests.push({
    PutRequest: {
      Item: marshall({
        PK: `DATE#${dailyUsage.isoDate}`,
        SK: 'TOTAL',
        dailyKwhTotal,
      }),
    },
  });

  return writeRequests;
}

async function batchWriteWithRetry(writeRequests: ReturnType<typeof createWriteRequestsForDay>) {
  return batchWithRetry({
    entries: writeRequests,
    batchSize: BATCH_SIZE,
    sendBatch: async (batch) => {
      const command = new BatchWriteItemCommand({
        RequestItems: {
          [Resource.OctopusTariffSwitcherDailyUsageTable.name]: batch,
        },
      });

      const response = await client.send(command);

      const unprocessedItems =
        response.UnprocessedItems?.[Resource.OctopusTariffSwitcherDailyUsageTable.name] ?? [];

      const failedItems = unprocessedItems.filter(
        (item): item is { PutRequest: { Item: Record<string, AttributeValue> } } =>
          item.PutRequest !== undefined,
      );

      const failedKeys = failedItems
        .map((item) => {
          const pk = item.PutRequest.Item.PK?.S ?? 'unknown pk';
          const sk = item.PutRequest.Item.SK?.S ?? 'unknown sk';

          return `${pk}::${sk}`;
        })
        .join(', ');

      return {
        failed: failedItems,
        reason: `Failed to batch write to DynamoDB: ${failedKeys}`,
      };
    },
  });
}

export function saveDailyUsage(dailyUsage: DailyUsage) {
  const writeRequests = createWriteRequestsForDay(dailyUsage);

  return batchWriteWithRetry(writeRequests);
}
