import { Graffle } from 'graffle';
import { Resource } from 'sst';
import { z } from 'zod';
import { API_GRAPHQL, API_PRODUCTS } from '../../constants/api';
import { getData } from '../../utils/fetch';
import { formatISO } from 'date-fns';
import type { TariffSelector } from '../../types/tariff';

export async function fetchToken() {
  const schema = z.object({
    obtainKrakenToken: z.object({
      token: z.string(),
    }),
  });

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
  });

  const result = await graffle.gql`
    mutation ObtainKrakenToken($input: ObtainJSONWebTokenInput!) {
      obtainKrakenToken(input: $input) {
        token
      }
    }
  `.send({ input: { APIKey: Resource.ApiKey.value } });

  const data = schema.parse(result);

  return data;
}

export async function fetchAccountInfo({ token }: { token: string }) {
  const schema = z.object({
    account: z.object({
      electricityAgreements: z
        .array(
          z.object({
            validFrom: z.string().datetime({ offset: true }),
            validTo: z.string().datetime({ offset: true }).nullable(),
            meterPoint: z.object({
              meters: z
                .array(
                  z.object({
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
              tariffCode: z.string(),
              standingCharge: z.number(),
            }),
          }),
        )
        .nonempty(),
    }),
  });

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
    headers: {
      authorization: token,
    },
  });

  const result = await graffle.gql`
      query Account($accountNumber: String!) {
        account(accountNumber: $accountNumber) {
          electricityAgreements(active: true) {
            validFrom
            validTo
            meterPoint {
              meters(includeInactive: false) {
                smartDevices {
                  deviceId
                }
              }
              mpan
            }
            tariff {
              ... on HalfHourlyTariff {
                productCode
                tariffCode
                standingCharge
              }
            }
          }
        }
      }
    `.send({ accountNumber: Resource.AccNumber.value });

  const results = schema.parse(result);

  return results;
}

export async function fetchSmartMeterTelemetry({
  token,
  deviceId,
  startDate,
  endDate,
}: { token: string; deviceId: string; startDate: string; endDate: string }) {
  const schema = z.object({
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

  const graffle = Graffle.create().transport({
    url: API_GRAPHQL,
    headers: {
      authorization: token,
    },
  });

  // consumptionDelta - Energy consumption in Wh between the read_at and the next reading.
  // costDeltaWithTax - Energy cost including VAT for the consumption delta in pence.
  // readAt - The start_at time of the telemetry data
  const result = await graffle.gql`
    query smartMeterTelemetry(
      $deviceId: String!,
      $start: DateTime,
      $end: DateTime,
      $grouping: TelemetryGrouping
    ) {
      smartMeterTelemetry(
        deviceId: $deviceId,
        start: $start,
        end: $end,
        grouping: $grouping
      ) {
        readAt
        consumptionDelta
        costDeltaWithTax
      }
    }
  `.send({ deviceId, start: startDate, end: endDate, grouping: 'HALF_HOURLY' });

  const results = schema.parse(result);

  return results;
}

export async function fetchAllProducts() {
  const schema = z.object({
    results: z.array(
      z.object({
        display_name: z.string(),
        direction: z.enum(['IMPORT', 'EXPORT']),
        brand: z.string(),
        code: z.string(),
      }),
    ),
  });

  const data = await getData(`${API_PRODUCTS}?brand=OCTOPUS_ENERGY&is_business=false`);

  const { results } = schema.parse(data);

  return results;
}

export async function fetchTodaysUnitRatesByTariff({ tariffCode, productCode }: TariffSelector) {
  const schema = z.object({
    results: z
      .array(
        z.object({
          value_inc_vat: z.number(),
          valid_from: z.string().datetime(),
          valid_to: z.string().datetime(),
        }),
      )
      .nonempty(),
  });

  const today = formatISO(new Date(), { representation: 'date' });

  const data = await getData(
    `${API_PRODUCTS}/${tariffCode}/electricity-tariffs/${productCode}/standard-unit-rates/?period_from=${today}T00:00:00Z&period_to=${today}T23:59:59Z`,
  );

  const { results } = schema.parse(data);

  return results;
}

export async function fetchTodaysStandingCharge({ tariffCode, productCode }: TariffSelector) {
  const schema = z.object({
    results: z
      .array(
        z.object({
          value_inc_vat: z.number(),
        }),
      )
      .nonempty(),
  });

  const data = await getData(
    `${API_PRODUCTS}/${tariffCode}/electricity-tariffs/${productCode}/standing-charges/`,
  );

  const { results } = schema.parse(data);

  return results;
}
