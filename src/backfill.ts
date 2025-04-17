import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { eachDayOfInterval, formatISO, parseISO, subDays } from 'date-fns';
import { getAccountInfo } from './functions/tariff-switcher/api-data';
import { fetchAllPastTariffs } from './functions/backfill/queries';
import { enrichDatesWithTariffData } from './functions/backfill/api-data';
import { logger } from './utils/logger';
import { toIsoDateString } from './utils/helpers';
import type { IsoDate } from './types/misc';
import { getDailyUsageCostByTariff } from './functions/tariff-switcher/cost-calculator';
import { formatResponse } from './utils/format-response';

function getDatesFromUntilYesterday(startDateISO: IsoDate) {
  const start = parseISO(startDateISO);
  // Exclude today
  const end = subDays(new Date(), 1);

  return eachDayOfInterval({ start, end }).map((date) =>
    toIsoDateString(formatISO(date, { representation: 'date' })),
  );
}

export async function backfill(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  logger.addContext(context);

  try {
    const [pastTariffs, { mpan, serialNumber }] = await Promise.all([
      fetchAllPastTariffs(),
      getAccountInfo(),
    ]);

    if (!process.env.BACKFILL_FROM_DATE) {
      throw new Error('BACKFILL_FROM_DATE env variable is not set');
    }

    const dates = getDatesFromUntilYesterday(toIsoDateString(process.env.BACKFILL_FROM_DATE));
    const items = await enrichDatesWithTariffData({ dates, pastTariffs, mpan, serialNumber });

    const dailyUageCost = new Map<IsoDate, { cost: number }>();

    for (const item of items.values()) {
      const cost = getDailyUsageCostByTariff({
        standingCharge: item.standingCharge,
        consumptionUnitRates: item.consumption,
        tariffUnitRates: item.unitRates,
      });

      dailyUageCost.set(item.isoDate, { cost });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Backfill complete',
        data: Object.fromEntries(dailyUageCost),
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
