import { z } from 'zod';
import { snakeToCamelSchema, urlSchema } from '../../utils/schema';

export const schemaToken = z.object({
  obtainKrakenToken: z.object({
    token: z.string(),
  }),
});

export const schemaAccount = z.object({
  account: z.object({
    electricityAgreements: z
      .array(
        z.object({
          validFrom: z.string().datetime({ offset: true }),
          validTo: z.string().datetime({ offset: true }).nullable(),
          meterPoint: z.object({
            mpan: z.string(),
            meters: z
              .array(
                z.object({
                  serialNumber: z.string(),
                  smartDevices: z
                    .array(
                      z.object({
                        deviceId: z.string(),
                      }),
                    )
                    .nonempty(),
                }),
              )
              .nonempty(),
          }),
          tariff: z.object({
            productCode: z.string(),
            tariffCode: z.string(),
            standingCharge: z.number(),
          }),
        }),
      )
      .nonempty(),
  }),
});

export const schemaSmartMeterTelemetry = z.object({
  smartMeterTelemetry: z
    .array(
      z.object({
        readAt: z.string(),
        consumptionDelta: z.coerce.number(),
        costDeltaWithTax: z.coerce.number(),
      }),
    )
    .nonempty(),
});

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

export const schemaUnitRatesByTariff = snakeToCamelSchema(
  z.object({
    results: z
      .array(
        z.object({
          value_inc_vat: z.number(),
          valid_from: z.string().datetime(),
          valid_to: z.string().datetime(),
        }),
      )
      .nonempty(),
  }),
);

export const schemaProductDetails = snakeToCamelSchema(
  z.object({
    single_register_electricity_tariffs: z.record(
      z.string(),
      z.record(
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
