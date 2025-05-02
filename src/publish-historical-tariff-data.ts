import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { eachDayOfInterval, formatISO, parseISO, subDays } from 'date-fns';
import { getAccountInfo } from './functions/tariff-switcher/api-data';
import { fetchAllPastTariffs } from './functions/backfill-message-publisher/queries';
import { enrichDatesWithTariffData } from './functions/backfill-message-publisher/api-data';
import { logger } from './utils/logger';
import { toIsoDateString } from './utils/helpers';
import { formatErrorResponse, formatResponse } from './utils/format-response';
import { buildQueueEntries, sendQueueEntriesInBatches } from './utils/queue';
import type { IsoDate } from './types/misc';

function listIsoDatesUntilYesterday(startDateISO: IsoDate) {
  const start = parseISO(startDateISO);
  // Exclude today
  const end = subDays(new Date(), 1);

  return eachDayOfInterval({ start, end }).map((date) =>
    toIsoDateString(formatISO(date, { representation: 'date' })),
  );
}

export async function publishHistoricalTariffData(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);

  const backfillFromDate = event.queryStringParameters?.backfillFromDate;

  try {
    if (!backfillFromDate) {
      throw new Error(
        'backfillFromDate query parameter is missing, please provide a date in the format YYYY-MM-DD',
      );
    }

    const [pastTariffs, { mpan, serialNumber }] = await Promise.all([
      fetchAllPastTariffs(),
      getAccountInfo(),
    ]);

    const dates = listIsoDatesUntilYesterday(toIsoDateString(backfillFromDate));
    const enrichedDates = await enrichDatesWithTariffData({
      dates,
      pastTariffs,
      mpan,
      serialNumber,
    });

    const queueEntries = buildQueueEntries(enrichedDates);
    await sendQueueEntriesInBatches(queueEntries);

    return formatResponse(200, {
      message: `Backfill data from ${backfillFromDate} successfully generated and sent to the queue`,
    });
  } catch (error) {
    return formatErrorResponse(error as Error);
  }
}
