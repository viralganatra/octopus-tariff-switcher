import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { eachDayOfInterval, formatISO, parseISO, subDays } from 'date-fns';
import { getAccountInfo } from './functions/tariff-switcher/api-data';
import { fetchAllPastTariffs } from './functions/publish-historical-tariff-data/queries';
import { enrichDatesWithTariffData } from './functions/publish-historical-tariff-data/api-data';
import { logger } from './utils/logger';
import { toIsoDateString } from './utils/helpers';
import { formatErrorResponse, formatResponse } from './utils/format-response';
import { buildQueueEntries, sendQueueEntriesInBatches } from './utils/queue';

function listIsoDatesInRange(fromDateIso: string, toDateIso: string | undefined) {
  const start = parseISO(fromDateIso);

  // Exclude today if toDateIso is not provided
  const end = toDateIso ?? subDays(new Date(), 1);

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
  const backfillToDate = event.queryStringParameters?.backfillToDate;

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

    const dates = listIsoDatesInRange(backfillFromDate, backfillToDate);
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
