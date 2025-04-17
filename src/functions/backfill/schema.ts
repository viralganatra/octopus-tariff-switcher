import { z } from 'zod';
import { snakeToCamelSchema } from '../../utils/schema';
import { getMsFromApiIsoString } from '../../utils/helpers';

export const schemaConsumption = z.object({
  results: z
    .array(
      z
        .object({
          consumption: z.number(),
          interval_start: z.string(),
        })
        .transform(({ consumption, interval_start }) => ({
          consumptionDelta: consumption * 1000,
          readAt: interval_start,
          readAtMs: getMsFromApiIsoString(interval_start),
        })),
    )
    .nonempty(),
});

export type ConsumptionIntervals = z.infer<typeof schemaConsumption>['results'];

export const schemaPastTariffs = snakeToCamelSchema(
  z.object({
    properties: z
      .array(
        z.object({
          electricity_meter_points: z
            .array(
              z.object({
                agreements: z
                  .array(
                    z.object({
                      tariff_code: z.string(),
                      valid_from: z.string().datetime({ offset: true }),
                      valid_to: z.string().datetime({ offset: true }),
                    }),
                  )
                  .nonempty(),
              }),
            )
            .nonempty(),
        }),
      )
      .nonempty(),
  }),
);

export type EletricityAgreements = z.infer<
  typeof schemaPastTariffs
>['properties'][0]['electricityMeterPoints'][0]['agreements'];

export const schemaStandingCharge = snakeToCamelSchema(
  z.object({
    results: z
      .array(
        z.object({
          value_inc_vat: z.number(),
        }),
      )
      .nonempty(),
  }),
);
