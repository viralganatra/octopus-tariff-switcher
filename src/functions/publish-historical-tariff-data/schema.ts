import { z } from 'zod';
import { snakeToCamelSchema } from '../../utils/schema';
import { getMsFromApiIsoString } from '../../utils/helpers';

const consumptionItemSchema = z
  .object({
    consumption: z.number(),
    interval_start: z.string(),
  })
  .transform(({ consumption, interval_start }) => ({
    consumptionDelta: consumption * 1000,
    readAt: interval_start,
    readAtMs: getMsFromApiIsoString(interval_start),
  }));

export const schemaConsumption = z.object({
  results: z.tuple([consumptionItemSchema], consumptionItemSchema),
});

export type ConsumptionIntervals = z.infer<typeof schemaConsumption>['results'];

const agreementSchema = z.object({
  tariff_code: z.string(),
  valid_from: z.iso.datetime({ offset: true }),
  valid_to: z.iso.datetime({ offset: true }),
});

const meterPointSchema = z.object({
  agreements: z.tuple([agreementSchema], agreementSchema),
});

const propertySchema = z.object({
  electricity_meter_points: z.tuple([meterPointSchema], meterPointSchema),
});

export const schemaPastTariffs = snakeToCamelSchema(
  z.object({
    properties: z.tuple([propertySchema], propertySchema),
  }),
);

export type EletricityAgreements = z.infer<
  typeof schemaPastTariffs
>['properties'][0]['electricityMeterPoints'][0]['agreements'];

const standingChargeItemSchema = z.object({
  value_inc_vat: z.number(),
});

export const schemaStandingCharge = snakeToCamelSchema(
  z.object({
    results: z.tuple([standingChargeItemSchema], standingChargeItemSchema),
  }),
);
