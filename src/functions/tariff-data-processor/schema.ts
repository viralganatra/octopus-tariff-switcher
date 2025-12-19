import { z } from 'zod';
import { toIsoDateString } from '../../utils/helpers';
import { TARIFFS, type TariffDisplayName, type TariffId } from '../../constants/tariff';

const unitRateSchema = z.object({
  validFrom: z.iso.datetime({ offset: true }),
  validFromMs: z.number(),
  validTo: z.iso.datetime({ offset: true }),
  validToMs: z.number(),
  unitCostInPence: z.number(),
});

const consumptionSchema = z.object({
  consumptionDelta: z.number(),
  readAt: z.iso.datetime({ offset: true }),
  readAtMs: z.number(),
});

export const schemaDailyUsage = z.object({
  id: z
    .enum([...(TARIFFS.map((t) => t.id) as [string, ...string[]])])
    .transform((val) => val as TariffId),
  isoDate: z.string().transform((date) => toIsoDateString(date)),
  tariffCode: z.string(),
  tariffName: z
    .enum([...(TARIFFS.map((t) => t.displayName) as [string, ...string[]])])
    .transform((val) => val as TariffDisplayName),
  productCode: z.string(),
  standingCharge: z.number(),
  unitRates: z.tuple([unitRateSchema], unitRateSchema),
  consumption: z.tuple([consumptionSchema], consumptionSchema),
});

export type DailyUsage = z.infer<typeof schemaDailyUsage>;
