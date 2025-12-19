import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { formatISO, subDays } from 'date-fns';
import { getAccountInfo } from './functions/tariff-switcher/api-data';
import { fetchAllPastTariffs } from './functions/publish-historical-tariff-data/queries';
import { enrichDatesWithTariffData } from './functions/publish-historical-tariff-data/api-data';
import { logger } from './utils/logger';
import { toIsoDateString } from './utils/helpers';
import { formatErrorResponse, formatResponse } from './utils/format-response';
import { buildQueueEntries, sendQueueEntriesInBatches } from './utils/queue';

function logSuccessAndRespond(message: string) {
  logger.info(message);

  return formatResponse(200, { message });
}

export async function publishYesterdaysTariff(
  _event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);

  try {
    const [pastTariffs, { mpan, serialNumber }] = await Promise.all([
      fetchAllPastTariffs(),
      getAccountInfo(),
    ]);

    const yesterday = subDays(new Date(), 1);
    const yesterdayIso = toIsoDateString(formatISO(yesterday, { representation: 'date' }));

    const enrichedDates = await enrichDatesWithTariffData({
      dates: [yesterdayIso],
      pastTariffs,
      mpan,
      serialNumber,
    });

    const queueEntries = buildQueueEntries(enrichedDates);
    await sendQueueEntriesInBatches(queueEntries);

    return logSuccessAndRespond(
      `Yesterday's data successfully generated and sent to the queue: ${yesterdayIso}`,
    );
  } catch (error) {
    return formatErrorResponse(error as Error);
  }
}
