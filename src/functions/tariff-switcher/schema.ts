import { z } from 'zod';
import { snakeToCamelSchema, urlSchema } from '../../utils/schema';
import { getMsFromApiIsoString } from '../../utils/helpers';

export const schemaToken = z.object({
  obtainKrakenToken: z.object({
    token: z.string(),
  }),
});

const smartDeviceSchema = z.object({
  deviceId: z.string(),
});

const meterSchema = z.object({
  serialNumber: z.string(),
  smartDevices: z.tuple([smartDeviceSchema], smartDeviceSchema),
});

const electricityAgreementSchema = z.object({
  validFrom: z.iso.datetime({ offset: true }),
  validTo: z.iso.datetime({ offset: true }).nullable(),
  meterPoint: z.object({
    mpan: z.string(),
    meters: z.tuple([meterSchema], meterSchema),
  }),
  tariff: z.object({
    productCode: z.string(),
    tariffCode: z.string(),
    standingCharge: z.number(),
  }),
});

export const schemaAccount = z.object({
  account: z.object({
    electricityAgreements: z.tuple([electricityAgreementSchema], electricityAgreementSchema),
  }),
});

const smartMeterTelemetryItemSchema = z
  .object({
    readAt: z.string(),
    consumptionDelta: z.coerce.number(),
    costDeltaWithTax: z.coerce.number(),
  })
  .transform(({ costDeltaWithTax, ...halfHourlyUnitRate }) => ({
    ...halfHourlyUnitRate,
    unitCostInPence: costDeltaWithTax,
    readAtMs: getMsFromApiIsoString(halfHourlyUnitRate.readAt),
  }));

export const schemaSmartMeterTelemetry = z.object({
  smartMeterTelemetry: z.tuple([smartMeterTelemetryItemSchema], smartMeterTelemetryItemSchema),
});

export type ConsumptionUnitRates = z.infer<typeof schemaSmartMeterTelemetry>['smartMeterTelemetry'];

export const schemaAllProducts = snakeToCamelSchema(
  z.object({
    results: z.array(
      z.object({
        display_name: z.string(),
        direction: z.enum(['IMPORT', 'EXPORT']),
        code: z.string(),
        links: z.array(
          z.object({
            href: urlSchema,
            rel: z.enum(['self']),
          }),
        ),
      }),
    ),
  }),
);

export type AllProducts = z.infer<typeof schemaAllProducts>['results'];

const unitRateItemSchema = z
  .object({
    value_inc_vat: z.number(),
    valid_from: z.iso.datetime(),
    valid_to: z.iso.datetime(),
  })
  .transform(({ value_inc_vat, valid_from, valid_to }) => ({
    validFrom: valid_from,
    validTo: valid_to,
    validFromMs: getMsFromApiIsoString(valid_from),
    validToMs: getMsFromApiIsoString(valid_to),
    unitCostInPence: value_inc_vat,
  }));

export const schemaUnitRatesByTariff = snakeToCamelSchema(
  z.object({
    results: z.tuple([unitRateItemSchema], unitRateItemSchema),
  }),
);

export type TariffUnitRates = z.infer<typeof schemaUnitRatesByTariff>['results'];

export const schemaProductDetails = snakeToCamelSchema(
  z.object({
    single_register_electricity_tariffs: z.record(
      z.string(),
      z.partialRecord(
        z.enum(['direct_debit_monthly', 'varying']),
        z.object({
          standing_charge_inc_vat: z.number(),
          links: z.array(
            z.object({
              href: urlSchema,
              rel: z.string(),
            }),
          ),
        }),
      ),
    ),
  }),
);

export const schemaTermsVersion = z.object({
  termsAndConditionsForProduct: z.object({
    name: z.string(),
    version: z.string(),
  }),
});

export const schemaStartOnboardingProcess = z.object({
  startOnboardingProcess: z.object({
    onboardingProcess: z
      .object({
        id: z.string(),
      })
      .nullable(),
    productEnrolment: z.object({
      id: z.string(),
    }),
    possibleErrors: z
      .array(
        z.object({
          message: z.string(),
          code: z.string(),
        }),
      )
      .optional(),
  }),
});

export const schemaAcceptTsAndCs = z.object({
  acceptTermsAndConditions: z.object({
    acceptedVersion: z.string(),
  }),
});
