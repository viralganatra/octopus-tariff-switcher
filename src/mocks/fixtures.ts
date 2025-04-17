import { addDays, format } from 'date-fns';

export const productsFixture = {
  count: 49,
  next: null,
  previous: null,
  results: [
    {
      code: 'AGILE-24-10-01',
      direction: 'IMPORT',
      full_name: 'Agile Octopus October 2024 v1',
      display_name: 'Agile Octopus',
      description:
        'With Agile Octopus, you get access to half-hourly energy prices, tied to wholesale prices and updated daily.  The unit rate is capped at 100p/kWh (including VAT).',
      is_variable: true,
      is_green: true,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: 12,
      available_from: '2024-10-01T00:00:00+01:00',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/AGILE-24-10-01/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'AGILE-OUTGOING-19-05-13',
      direction: 'EXPORT',
      full_name: 'Agile Outgoing Octopus May 2019',
      display_name: 'Agile Outgoing Octopus',
      description:
        'Outgoing Octopus Agile rate pays you for all your exported energy based on the day-ahead wholesale rate.',
      is_variable: true,
      is_green: true,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: 12,
      available_from: '2018-01-01T00:00:00Z',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/AGILE-OUTGOING-19-05-13/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'COSY-22-12-08',
      direction: 'IMPORT',
      full_name: 'Cosy Octopus',
      display_name: 'Cosy Octopus',
      description:
        'Cosy Octopus is a heat pump tariff with eight hours of super cheap electricity every day to warm your home.',
      is_variable: true,
      is_green: false,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: null,
      available_from: '2022-12-13T00:00:00Z',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/COSY-22-12-08/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'FLUX-EXPORT-23-02-14',
      direction: 'EXPORT',
      full_name: 'Octopus Flux Export',
      display_name: 'Octopus Flux Export',
      description: 'Octopus Flux Export February 2023 v1',
      is_variable: true,
      is_green: false,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: null,
      available_from: '2023-02-14T00:00:00Z',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/FLUX-EXPORT-23-02-14/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'FLUX-IMPORT-23-02-14',
      direction: 'IMPORT',
      full_name: 'Octopus Flux Import',
      display_name: 'Octopus Flux Import',
      description:
        'Power your home with 100% renewable energy on this Octopus Energy electricity tariff designed exclusively for solar and battery owners.',
      is_variable: true,
      is_green: false,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: null,
      available_from: '2023-02-14T00:00:00Z',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/FLUX-IMPORT-23-02-14/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'GO-VAR-22-10-14',
      direction: 'IMPORT',
      full_name: 'Octopus Go',
      display_name: 'Octopus Go',
      description:
        'The smart EV tariff with super cheap electricity between 00:30 - 05:30 every night',
      is_variable: true,
      is_green: false,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: null,
      available_from: '2022-10-14T00:00:00+01:00',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/GO-VAR-22-10-14/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'POWER-PACK-24-02-15',
      direction: 'EXPORT',
      full_name: 'Octopus Power Pack',
      display_name: 'Octopus Power Pack',
      description: 'Octopus Power Pack',
      is_variable: true,
      is_green: false,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: null,
      available_from: '2024-02-15T11:00:00Z',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/POWER-PACK-24-02-15/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'PREPAY-VAR-18-09-21',
      direction: 'IMPORT',
      full_name: 'Octopus Key and Card',
      display_name: 'Octopus Key and Card',
      description: 'Non-smart prepayment tariff',
      is_variable: true,
      is_green: false,
      is_tracker: false,
      is_prepay: true,
      is_business: false,
      is_restricted: false,
      term: null,
      available_from: '2018-10-10T00:00:00+01:00',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/PREPAY-VAR-18-09-21/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'SNUG-24-11-07',
      direction: 'IMPORT',
      full_name: 'Snug Octopus',
      display_name: 'Snug Octopus',
      description:
        'Snug Octopus is a smart tariff for storage heaters that schedules charging at the cheapest, greenest times overnight and boosts heating in the afternoon to keep homes cosy.',
      is_variable: true,
      is_green: false,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: null,
      available_from: '2024-11-07T00:00:00Z',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/SNUG-24-11-07/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'VAR-22-11-01',
      direction: 'IMPORT',
      full_name: 'Flexible Octopus',
      display_name: 'Flexible Octopus',
      description:
        'Flexible Octopus prices follow wholesale costs and update every 3 months. Prices are expected to rise in April.',
      is_variable: true,
      is_green: false,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: null,
      available_from: '2023-03-28T10:35:00+01:00',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/VAR-22-11-01/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
    {
      code: 'ZERO-EXPORT-60M-22-05-01',
      direction: 'EXPORT',
      full_name: 'Octopus Zero Bills Export (5 years)',
      display_name: 'Octopus Zero Export',
      description:
        'Octopus ZERO Export Tariff - For registered Octopus ZERO homes ONLY.  Fair use allowance: 10MWh of net electricity import per year',
      is_variable: false,
      is_green: false,
      is_tracker: false,
      is_prepay: false,
      is_business: false,
      is_restricted: false,
      term: 60,
      available_from: '2022-05-01T00:00:00+01:00',
      available_to: null,
      links: [
        {
          href: 'https://api.octopus.energy/v1/products/ZERO-EXPORT-60M-22-05-01/',
          method: 'GET',
          rel: 'self',
        },
      ],
      brand: 'OCTOPUS_ENERGY',
    },
  ],
};

export const telemetryFixture = {
  smartMeterTelemetry: [
    {
      readAt: '2025-03-03T00:30:00+00:00',
      consumptionDelta: '84.0000',
      costDeltaWithTax: '1.5117',
    },
    {
      readAt: '2025-03-03T01:00:00+00:00',
      consumptionDelta: '71.0000',
      costDeltaWithTax: '1.1347',
    },
    {
      readAt: '2025-03-03T01:30:00+00:00',
      consumptionDelta: '65.0000',
      costDeltaWithTax: '1.0033',
    },
    {
      readAt: '2025-03-03T02:00:00+00:00',
      consumptionDelta: '65.0000',
      costDeltaWithTax: '1.0176',
    },
    {
      readAt: '2025-03-03T02:30:00+00:00',
      consumptionDelta: '67.0000',
      costDeltaWithTax: '1.0341',
    },
    {
      readAt: '2025-03-03T03:00:00+00:00',
      consumptionDelta: '64.0000',
      costDeltaWithTax: '1.0020',
    },
    {
      readAt: '2025-03-03T03:30:00+00:00',
      consumptionDelta: '73.0000',
      costDeltaWithTax: '1.1076',
    },
    {
      readAt: '2025-03-03T04:00:00+00:00',
      consumptionDelta: '63.0000',
      costDeltaWithTax: '1.1530',
    },
    {
      readAt: '2025-03-03T04:30:00+00:00',
      consumptionDelta: '74.0000',
      costDeltaWithTax: '1.1997',
    },
    {
      readAt: '2025-03-03T05:00:00+00:00',
      consumptionDelta: '60.0000',
      costDeltaWithTax: '1.1699',
    },
    {
      readAt: '2025-03-03T05:30:00+00:00',
      consumptionDelta: '77.0000',
      costDeltaWithTax: '1.6574',
    },
    {
      readAt: '2025-03-03T06:00:00+00:00',
      consumptionDelta: '58.0000',
      costDeltaWithTax: '1.3118',
    },
    {
      readAt: '2025-03-03T06:30:00+00:00',
      consumptionDelta: '86.0000',
      costDeltaWithTax: '2.2268',
    },
    {
      readAt: '2025-03-03T07:00:00+00:00',
      consumptionDelta: '63.0000',
      costDeltaWithTax: '1.5975',
    },
    {
      readAt: '2025-03-03T07:30:00+00:00',
      consumptionDelta: '145.0000',
      costDeltaWithTax: '3.8047',
    },
    {
      readAt: '2025-03-03T08:00:00+00:00',
      consumptionDelta: '136.0000',
      costDeltaWithTax: '3.2744',
    },
    {
      readAt: '2025-03-03T08:30:00+00:00',
      consumptionDelta: '74.0000',
      costDeltaWithTax: '1.5501',
    },
    {
      readAt: '2025-03-03T09:00:00+00:00',
      consumptionDelta: '104.0000',
      costDeltaWithTax: '1.8651',
    },
    {
      readAt: '2025-03-03T09:30:00+00:00',
      consumptionDelta: '81.0000',
      costDeltaWithTax: '1.1431',
    },
    {
      readAt: '2025-03-03T10:00:00+00:00',
      consumptionDelta: '99.0000',
      costDeltaWithTax: '1.3472',
    },
    {
      readAt: '2025-03-03T10:30:00+00:00',
      consumptionDelta: '37.0000',
      costDeltaWithTax: '0.4242',
    },
  ],
};

export const telemetry2020Fixture = {
  smartMeterTelemetry: [
    {
      readAt: '2020-03-03T00:30:00+00:00',
      consumptionDelta: '84.0000',
      costDeltaWithTax: '1.5117',
    },
  ],
};

export const accountFixture = {
  account: {
    electricityAgreements: [
      {
        validFrom: '2025-03-03T00:00:00+00:00',
        validTo: '2026-02-24T00:00:00+00:00',
        meterPoint: {
          meters: [
            {
              serialNumber: 'serial number',
              smartDevices: [
                {
                  deviceId: '00-00-00-00-00-00-99-2F',
                },
              ],
            },
          ],
          mpan: '1012003690000',
        },
        tariff: {
          productCode: 'AGILE-24-10-01',
          tariffCode: 'E-1R-AGILE-24-10-01-A',
          standingCharge: 48.788145,
        },
      },
    ],
  },
};

export const unitRatesFixture = (date = '2025-03-03') => {
  const nextDay = addDays(new Date(date), 1);
  const nextDateIso = format(nextDay, 'yyyy-MM-dd');

  return {
    count: 7,
    next: null,
    previous: null,
    results: [
      {
        value_exc_vat: 12.6016,
        value_inc_vat: 13.23168,
        valid_from: `${date}T22:00:00Z`,
        valid_to: `${nextDateIso}T00:00:00Z`,
        payment_method: null,
      },
      {
        value_exc_vat: 25.6966,
        value_inc_vat: 26.98143,
        valid_from: `${date}T19:00:00Z`,
        valid_to: `${date}T22:00:00Z`,
        payment_method: null,
      },
      {
        value_exc_vat: 38.545,
        value_inc_vat: 40.47225,
        valid_from: `${date}T16:00:00Z`,
        valid_to: `${date}T19:00:00Z`,
        payment_method: null,
      },
      {
        value_exc_vat: 12.6016,
        value_inc_vat: 13.23168,
        valid_from: `${date}T13:00:00Z`,
        valid_to: `${date}T16:00:00Z`,
        payment_method: null,
      },
      {
        value_exc_vat: 25.6966,
        value_inc_vat: 26.98143,
        valid_from: `${date}T07:00:00Z`,
        valid_to: `${date}T13:00:00Z`,
        payment_method: null,
      },
      {
        value_exc_vat: 12.6016,
        value_inc_vat: 13.23168,
        valid_from: `${date}T04:00:00Z`,
        valid_to: `${date}T07:00:00Z`,
        payment_method: null,
      },
      {
        value_exc_vat: 25.6966,
        value_inc_vat: 26.98143,
        valid_from: `${date}T00:00:00Z`,
        valid_to: `${date}T04:00:00Z`,
        payment_method: null,
      },
    ],
  };
};

export const unitRates2020Fixture = {
  count: 7,
  next: null,
  previous: null,
  results: [
    {
      value_exc_vat: 12.6016,
      value_inc_vat: 13.23168,
      valid_from: '2020-03-03T22:00:00Z',
      valid_to: '2020-03-02T00:00:00Z',
      payment_method: null,
    },
  ],
};

export const productAgileFixture = {
  code: 'AGILE-24-10-01',
  full_name: 'Agile Octopus October 2024 v1',
  display_name: 'Agile Octopus',
  description:
    'With Agile Octopus, you get access to half-hourly energy prices, tied to wholesale prices and updated daily.  The unit rate is capped at 100p/kWh (including VAT).',
  available_from: '2024-10-01T00:00:00+01:00',
  available_to: null,
  tariffs_active_at: '2025-03-12T11:10:08.045223Z',
  single_register_electricity_tariffs: {
    _A: {
      direct_debit_monthly: {
        code: 'E-1R-AGILE-24-10-01-A',
        standing_charge_exc_vat: 46.4649,
        standing_charge_inc_vat: 48.788145,
        links: [
          {
            href: 'https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-A/standing-charges/',
            method: 'GET',
            rel: 'standing_charges',
          },
          {
            href: 'https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-A/standard-unit-rates/',
            method: 'GET',
            rel: 'standard_unit_rates',
          },
        ],
        standard_unit_rate_exc_vat: 17.82,
        standard_unit_rate_inc_vat: 18.711,
      },
    },
    _B: {
      direct_debit_monthly: {
        code: 'E-1R-AGILE-24-10-01-B',
        standing_charge_exc_vat: 52.2352,
        standing_charge_inc_vat: 54.84696,
        links: [
          {
            href: 'https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-B/standing-charges/',
            method: 'GET',
            rel: 'standing_charges',
          },
          {
            href: 'https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-B/standard-unit-rates/',
            method: 'GET',
            rel: 'standard_unit_rates',
          },
        ],
        standard_unit_rate_exc_vat: 16.97,
        standard_unit_rate_inc_vat: 17.8185,
      },
    },
    _C: {
      direct_debit_monthly: {
        code: 'E-1R-AGILE-24-10-01-C',
        standing_charge_exc_vat: 37.6525,
        standing_charge_inc_vat: 39.535125,
        links: [
          {
            href: 'https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-C/standing-charges/',
            method: 'GET',
            rel: 'standing_charges',
          },
          {
            href: 'https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-C/standard-unit-rates/',
            method: 'GET',
            rel: 'standard_unit_rates',
          },
        ],
        standard_unit_rate_exc_vat: 16.97,
        standard_unit_rate_inc_vat: 17.8185,
      },
    },
  },
  dual_register_electricity_tariffs: {},
  single_register_gas_tariffs: {},
  links: [
    {
      href: 'https://api.octopus.energy/v1/products/AGILE-24-10-01/',
      method: 'GET',
      rel: 'self',
    },
  ],
  brand: 'OCTOPUS_ENERGY',
};

export const productCosyFixture = {
  code: 'COSY-22-12-08',
  full_name: 'Cosy Octopus',
  display_name: 'Cosy Octopus',
  description:
    'Cosy Octopus is a heat pump tariff with eight hours of super cheap electricity every day to warm your home.',
  available_from: '2022-12-13T00:00:00Z',
  available_to: null,
  tariffs_active_at: '2025-03-12T09:28:59.418252Z',
  single_register_electricity_tariffs: {
    _A: {
      direct_debit_monthly: {
        code: 'E-1R-COSY-22-12-08-A',
        standing_charge_exc_vat: 46.4649,
        standing_charge_inc_vat: 48.788145,
        links: [
          {
            href: 'https://api.octopus.energy/v1/products/COSY-22-12-08/electricity-tariffs/E-1R-COSY-22-12-08-A/standing-charges/',
            method: 'GET',
            rel: 'standing_charges',
          },
          {
            href: 'https://api.octopus.energy/v1/products/COSY-22-12-08/electricity-tariffs/E-1R-COSY-22-12-08-A/standard-unit-rates/',
            method: 'GET',
            rel: 'standard_unit_rates',
          },
        ],
        standard_unit_rate_exc_vat: 25.6966,
        standard_unit_rate_inc_vat: 26.98143,
      },
    },
    _B: {
      direct_debit_monthly: {
        code: 'E-1R-COSY-22-12-08-B',
        standing_charge_exc_vat: 52.2352,
        standing_charge_inc_vat: 54.84696,
        links: [
          {
            href: 'https://api.octopus.energy/v1/products/COSY-22-12-08/electricity-tariffs/E-1R-COSY-22-12-08-B/standing-charges/',
            method: 'GET',
            rel: 'standing_charges',
          },
          {
            href: 'https://api.octopus.energy/v1/products/COSY-22-12-08/electricity-tariffs/E-1R-COSY-22-12-08-B/standard-unit-rates/',
            method: 'GET',
            rel: 'standard_unit_rates',
          },
        ],
        standard_unit_rate_exc_vat: 24.2316,
        standard_unit_rate_inc_vat: 25.44318,
      },
    },
  },
  dual_register_electricity_tariffs: {},
  single_register_gas_tariffs: {},
  links: [
    {
      href: 'https://api.octopus.energy/v1/products/COSY-22-12-08/',
      method: 'GET',
      rel: 'self',
    },
  ],
  brand: 'OCTOPUS_ENERGY',
};

export const productGoFixture = {
  code: 'GO-VAR-22-10-14',
  full_name: 'Octopus Go',
  display_name: 'Octopus Go',
  description: 'The smart EV tariff with super cheap electricity between 00:30 - 05:30 every night',
  available_from: '2022-10-14T00:00:00+01:00',
  available_to: null,
  tariffs_active_at: '2025-03-12T11:20:51.815788Z',
  single_register_electricity_tariffs: {
    _A: {
      direct_debit_monthly: {
        code: 'E-1R-GO-VAR-22-10-14-A',
        standing_charge_exc_vat: 6.4649,
        standing_charge_inc_vat: 8.788145,
        links: [
          {
            href: 'https://api.octopus.energy/v1/products/GO-VAR-22-10-14/electricity-tariffs/E-1R-GO-VAR-22-10-14-A/standing-charges/',
            method: 'GET',
            rel: 'standing_charges',
          },
          {
            href: 'https://api.octopus.energy/v1/products/GO-VAR-22-10-14/electricity-tariffs/E-1R-GO-VAR-22-10-14-A/standard-unit-rates/',
            method: 'GET',
            rel: 'standard_unit_rates',
          },
        ],
        standard_unit_rate_exc_vat: 5.8119,
        standard_unit_rate_inc_vat: 7.102495,
      },
    },
    _B: {
      direct_debit_monthly: {
        code: 'E-1R-GO-VAR-22-10-14-B',
        standing_charge_exc_vat: 2.2352,
        standing_charge_inc_vat: 4.84696,
        links: [
          {
            href: 'https://api.octopus.energy/v1/products/GO-VAR-22-10-14/electricity-tariffs/E-1R-GO-VAR-22-10-14-B/standing-charges/',
            method: 'GET',
            rel: 'standing_charges',
          },
          {
            href: 'https://api.octopus.energy/v1/products/GO-VAR-22-10-14/electricity-tariffs/E-1R-GO-VAR-22-10-14-B/standard-unit-rates/',
            method: 'GET',
            rel: 'standard_unit_rates',
          },
        ],
        standard_unit_rate_exc_vat: 4.1914,
        standard_unit_rate_inc_vat: 5.40097,
      },
    },
  },
  dual_register_electricity_tariffs: {},
  single_register_gas_tariffs: {},
  links: [
    {
      href: 'https://api.octopus.energy/v1/products/GO-VAR-22-10-14/',
      method: 'GET',
      rel: 'self',
    },
  ],
  brand: 'OCTOPUS_ENERGY',
};

export const termsAndConditionsForProductFixture = {
  termsAndConditionsForProduct: {
    name: 'terms',
    version: '1.5',
  },
};

export const onboardingProcessFixture = {
  startOnboardingProcess: {
    onboardingProcess: {
      id: '123',
    },
    productEnrolment: {
      id: '456',
    },
  },
};

export const acceptTermsAndConditionsFxture = {
  acceptTermsAndConditions: {
    acceptedVersion: '789',
  },
};

export const standingChargeAgileFixture = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      value_exc_vat: 45.3392,
      value_inc_vat: 47.60616,
      valid_from: '2025-03-31T23:00:00Z',
      valid_to: null,
      payment_method: null,
    },
  ],
};

export const standingChargeCosyFixture = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      value_exc_vat: 145.3392,
      value_inc_vat: 147.60616,
      valid_from: '2025-03-31T23:00:00Z',
      valid_to: null,
      payment_method: null,
    },
  ],
};

export const consumptionAgileFixture = (date = '2025-03-17') => {
  const nextDay = addDays(new Date(date), 1);
  const nextDateIso = format(nextDay, 'yyyy-MM-dd');

  return {
    count: 48,
    next: null,
    previous: null,
    results: [
      {
        consumption: 0.074,
        interval_start: `${date}T00:00:00Z`,
        interval_end: `${date}T00:30:00Z`,
      },
      {
        consumption: 0.062,
        interval_start: `${date}T00:30:00Z`,
        interval_end: `${date}T01:00:00Z`,
      },
      {
        consumption: 0.077,
        interval_start: `${date}T01:00:00Z`,
        interval_end: `${date}T01:30:00Z`,
      },
      {
        consumption: 0.058,
        interval_start: `${date}T01:30:00Z`,
        interval_end: `${date}T02:00:00Z`,
      },
      {
        consumption: 0.077,
        interval_start: `${date}T02:00:00Z`,
        interval_end: `${date}T02:30:00Z`,
      },
      {
        consumption: 0.059,
        interval_start: `${date}T02:30:00Z`,
        interval_end: `${date}T03:00:00Z`,
      },
      {
        consumption: 0.074,
        interval_start: `${date}T03:00:00Z`,
        interval_end: `${date}T03:30:00Z`,
      },
      {
        consumption: 0.064,
        interval_start: `${date}T03:30:00Z`,
        interval_end: `${date}T04:00:00Z`,
      },
      {
        consumption: 0.069,
        interval_start: `${date}T04:00:00Z`,
        interval_end: `${date}T04:30:00Z`,
      },
      {
        consumption: 0.068,
        interval_start: `${date}T04:30:00Z`,
        interval_end: `${date}T05:00:00Z`,
      },
      {
        consumption: 0.063,
        interval_start: `${date}T05:00:00Z`,
        interval_end: `${date}T05:30:00Z`,
      },
      {
        consumption: 0.516,
        interval_start: `${date}T05:30:00Z`,
        interval_end: `${date}T06:00:00Z`,
      },
      {
        consumption: 0.303,
        interval_start: `${date}T06:00:00Z`,
        interval_end: `${date}T06:30:00Z`,
      },
      {
        consumption: 0.134,
        interval_start: `${date}T06:30:00Z`,
        interval_end: `${date}T07:00:00Z`,
      },
      {
        consumption: 0.083,
        interval_start: `${date}T07:00:00Z`,
        interval_end: `${date}T07:30:00Z`,
      },
      {
        consumption: 0.13,
        interval_start: `${date}T07:30:00Z`,
        interval_end: `${date}T08:00:00Z`,
      },
      {
        consumption: 0.112,
        interval_start: `${date}T08:00:00Z`,
        interval_end: `${date}T08:30:00Z`,
      },
      {
        consumption: 0.119,
        interval_start: `${date}T08:30:00Z`,
        interval_end: `${date}T09:00:00Z`,
      },
      {
        consumption: 0.103,
        interval_start: `${date}T09:00:00Z`,
        interval_end: `${date}T09:30:00Z`,
      },
      {
        consumption: 0.113,
        interval_start: `${date}T09:30:00Z`,
        interval_end: `${date}T10:00:00Z`,
      },
      {
        consumption: 0.147,
        interval_start: `${date}T10:00:00Z`,
        interval_end: `${date}T10:30:00Z`,
      },
      {
        consumption: 0.114,
        interval_start: `${date}T10:30:00Z`,
        interval_end: `${date}T11:00:00Z`,
      },
      {
        consumption: 0.1,
        interval_start: `${date}T11:00:00Z`,
        interval_end: `${date}T11:30:00Z`,
      },
      {
        consumption: 0.087,
        interval_start: `${date}T11:30:00Z`,
        interval_end: `${date}T12:00:00Z`,
      },
      {
        consumption: 0.156,
        interval_start: `${date}T12:00:00Z`,
        interval_end: `${date}T12:30:00Z`,
      },
      {
        consumption: 0.118,
        interval_start: `${date}T12:30:00Z`,
        interval_end: `${date}T13:00:00Z`,
      },
      {
        consumption: 0.175,
        interval_start: `${date}T13:00:00Z`,
        interval_end: `${date}T13:30:00Z`,
      },
      {
        consumption: 0.287,
        interval_start: `${date}T13:30:00Z`,
        interval_end: `${date}T14:00:00Z`,
      },
      {
        consumption: 0.795,
        interval_start: `${date}T14:00:00Z`,
        interval_end: `${date}T14:30:00Z`,
      },
      {
        consumption: 0.493,
        interval_start: `${date}T14:30:00Z`,
        interval_end: `${date}T15:00:00Z`,
      },
      {
        consumption: 0.108,
        interval_start: `${date}T15:00:00Z`,
        interval_end: `${date}T15:30:00Z`,
      },
      {
        consumption: 0.142,
        interval_start: `${date}T15:30:00Z`,
        interval_end: `${date}T16:00:00Z`,
      },
      {
        consumption: 0.126,
        interval_start: `${date}T16:00:00Z`,
        interval_end: `${date}T16:30:00Z`,
      },
      {
        consumption: 0.212,
        interval_start: `${date}T16:30:00Z`,
        interval_end: `${date}T17:00:00Z`,
      },
      {
        consumption: 0.179,
        interval_start: `${date}T17:00:00Z`,
        interval_end: `${date}T17:30:00Z`,
      },
      {
        consumption: 0.176,
        interval_start: `${date}T17:30:00Z`,
        interval_end: `${date}T18:00:00Z`,
      },
      {
        consumption: 0.299,
        interval_start: `${date}T18:00:00Z`,
        interval_end: `${date}T18:30:00Z`,
      },
      {
        consumption: 0.219,
        interval_start: `${date}T18:30:00Z`,
        interval_end: `${date}T19:00:00Z`,
      },
      {
        consumption: 0.197,
        interval_start: `${date}T19:00:00Z`,
        interval_end: `${date}T19:30:00Z`,
      },
      {
        consumption: 0.158,
        interval_start: `${date}T19:30:00Z`,
        interval_end: `${date}T20:00:00Z`,
      },
      {
        consumption: 0.152,
        interval_start: `${date}T20:00:00Z`,
        interval_end: `${date}T20:30:00Z`,
      },
      {
        consumption: 0.172,
        interval_start: `${date}T20:30:00Z`,
        interval_end: `${date}T21:00:00Z`,
      },
      {
        consumption: 0.163,
        interval_start: `${date}T21:00:00Z`,
        interval_end: `${date}T21:30:00Z`,
      },
      {
        consumption: 0.116,
        interval_start: `${date}T21:30:00Z`,
        interval_end: `${date}T22:00:00Z`,
      },
      {
        consumption: 0.088,
        interval_start: `${date}T22:00:00Z`,
        interval_end: `${date}T22:30:00Z`,
      },
      {
        consumption: 0.064,
        interval_start: `${date}T22:30:00Z`,
        interval_end: `${date}T23:00:00Z`,
      },
      {
        consumption: 0.077,
        interval_start: `${date}T23:00:00Z`,
        interval_end: `${date}T23:30:00Z`,
      },
      {
        consumption: 0.061,
        interval_start: `${date}T23:30:00Z`,
        interval_end: `${nextDateIso}T00:00:00Z`,
      },
    ],
  };
};

export const consumptionCosyFixture = {
  count: 48,
  next: null,
  previous: null,
  results: [
    {
      consumption: 0.072,
      interval_start: '2020-02-15T01:00:00+01:00',
      interval_end: '2020-02-15T01:30:00+01:00',
    },
    {
      consumption: 0.897,
      interval_start: '2020-02-15T01:30:00+01:00',
      interval_end: '2020-02-15T02:00:00+01:00',
    },
    {
      consumption: 0.314,
      interval_start: '2020-02-15T02:00:00+01:00',
      interval_end: '2020-02-15T02:30:00+01:00',
    },
    {
      consumption: 0.328,
      interval_start: '2020-02-15T02:30:00+01:00',
      interval_end: '2020-02-15T03:00:00+01:00',
    },
    {
      consumption: 0.335,
      interval_start: '2020-02-15T03:00:00+01:00',
      interval_end: '2020-02-15T03:30:00+01:00',
    },
    {
      consumption: 0.314,
      interval_start: '2020-02-15T03:30:00+01:00',
      interval_end: '2020-02-15T04:00:00+01:00',
    },
    {
      consumption: 0.288,
      interval_start: '2020-02-15T04:00:00+01:00',
      interval_end: '2020-02-15T04:30:00+01:00',
    },
    {
      consumption: 0.308,
      interval_start: '2020-02-15T04:30:00+01:00',
      interval_end: '2020-02-15T05:00:00+01:00',
    },
    {
      consumption: 0.267,
      interval_start: '2020-02-15T05:00:00+01:00',
      interval_end: '2020-02-15T05:30:00+01:00',
    },
    {
      consumption: 0.302,
      interval_start: '2020-02-15T05:30:00+01:00',
      interval_end: '2020-02-15T06:00:00+01:00',
    },
    {
      consumption: 0.063,
      interval_start: '2020-02-15T06:00:00+01:00',
      interval_end: '2020-02-15T06:30:00+01:00',
    },
    {
      consumption: 0.095,
      interval_start: '2020-02-15T06:30:00+01:00',
      interval_end: '2020-02-15T07:00:00+01:00',
    },
    {
      consumption: 0.073,
      interval_start: '2020-02-15T07:00:00+01:00',
      interval_end: '2020-02-15T07:30:00+01:00',
    },
    {
      consumption: 0.108,
      interval_start: '2020-02-15T07:30:00+01:00',
      interval_end: '2020-02-15T08:00:00+01:00',
    },
    {
      consumption: 0.093,
      interval_start: '2020-02-15T08:00:00+01:00',
      interval_end: '2020-02-15T08:30:00+01:00',
    },
    {
      consumption: 0.159,
      interval_start: '2020-02-15T08:30:00+01:00',
      interval_end: '2020-02-15T09:00:00+01:00',
    },
    {
      consumption: 0.087,
      interval_start: '2020-02-15T09:00:00+01:00',
      interval_end: '2020-02-15T09:30:00+01:00',
    },
    {
      consumption: 0.08,
      interval_start: '2020-02-15T09:30:00+01:00',
      interval_end: '2020-02-15T10:00:00+01:00',
    },
    {
      consumption: 0.083,
      interval_start: '2020-02-15T10:00:00+01:00',
      interval_end: '2020-02-15T10:30:00+01:00',
    },
    {
      consumption: 0.062,
      interval_start: '2020-02-15T10:30:00+01:00',
      interval_end: '2020-02-15T11:00:00+01:00',
    },
    {
      consumption: 0.196,
      interval_start: '2020-02-15T11:00:00+01:00',
      interval_end: '2020-02-15T11:30:00+01:00',
    },
    {
      consumption: 0.152,
      interval_start: '2020-02-15T11:30:00+01:00',
      interval_end: '2020-02-15T12:00:00+01:00',
    },
    {
      consumption: 0.068,
      interval_start: '2020-02-15T12:00:00+01:00',
      interval_end: '2020-02-15T12:30:00+01:00',
    },
    {
      consumption: 0.08,
      interval_start: '2020-02-15T12:30:00+01:00',
      interval_end: '2020-02-15T13:00:00+01:00',
    },
    {
      consumption: 0.135,
      interval_start: '2020-02-15T13:00:00+01:00',
      interval_end: '2020-02-15T13:30:00+01:00',
    },
    {
      consumption: 0.08,
      interval_start: '2020-02-15T13:30:00+01:00',
      interval_end: '2020-02-15T14:00:00+01:00',
    },
    {
      consumption: 0.065,
      interval_start: '2020-02-15T14:00:00+01:00',
      interval_end: '2020-02-15T14:30:00+01:00',
    },
    {
      consumption: 0.077,
      interval_start: '2020-02-15T14:30:00+01:00',
      interval_end: '2020-02-15T15:00:00+01:00',
    },
    {
      consumption: 0.076,
      interval_start: '2020-02-15T15:00:00+01:00',
      interval_end: '2020-02-15T15:30:00+01:00',
    },
    {
      consumption: 0.145,
      interval_start: '2020-02-15T15:30:00+01:00',
      interval_end: '2020-02-15T16:00:00+01:00',
    },
    {
      consumption: 0.1,
      interval_start: '2020-02-15T16:00:00+01:00',
      interval_end: '2020-02-15T16:30:00+01:00',
    },
    {
      consumption: 0.161,
      interval_start: '2020-02-15T16:30:00+01:00',
      interval_end: '2020-02-15T17:00:00+01:00',
    },
    {
      consumption: 0.118,
      interval_start: '2020-02-15T17:00:00+01:00',
      interval_end: '2020-02-15T17:30:00+01:00',
    },
    {
      consumption: 0.128,
      interval_start: '2020-02-15T17:30:00+01:00',
      interval_end: '2020-02-15T18:00:00+01:00',
    },
    {
      consumption: 0.206,
      interval_start: '2020-02-15T18:00:00+01:00',
      interval_end: '2020-02-15T18:30:00+01:00',
    },
    {
      consumption: 0.137,
      interval_start: '2020-02-15T18:30:00+01:00',
      interval_end: '2020-02-15T19:00:00+01:00',
    },
    {
      consumption: 0.141,
      interval_start: '2020-02-15T19:00:00+01:00',
      interval_end: '2020-02-15T19:30:00+01:00',
    },
    {
      consumption: 0.135,
      interval_start: '2020-02-15T19:30:00+01:00',
      interval_end: '2020-02-15T20:00:00+01:00',
    },
    {
      consumption: 0.143,
      interval_start: '2020-02-15T20:00:00+01:00',
      interval_end: '2020-02-15T20:30:00+01:00',
    },
    {
      consumption: 0.16,
      interval_start: '2020-02-15T20:30:00+01:00',
      interval_end: '2020-02-15T21:00:00+01:00',
    },
    {
      consumption: 0.162,
      interval_start: '2020-02-15T21:00:00+01:00',
      interval_end: '2020-02-15T21:30:00+01:00',
    },
    {
      consumption: 0.124,
      interval_start: '2020-02-15T21:30:00+01:00',
      interval_end: '2020-02-15T22:00:00+01:00',
    },
    {
      consumption: 0.106,
      interval_start: '2020-02-15T22:00:00+01:00',
      interval_end: '2020-02-15T22:30:00+01:00',
    },
    {
      consumption: 0.069,
      interval_start: '2020-02-15T22:30:00+01:00',
      interval_end: '2020-02-15T23:00:00+01:00',
    },
    {
      consumption: 0.079,
      interval_start: '2020-02-15T23:00:00+01:00',
      interval_end: '2020-02-15T23:30:00+01:00',
    },
    {
      consumption: 0.058,
      interval_start: '2020-02-15T23:30:00+01:00',
      interval_end: '2020-02-16T00:00:00+01:00',
    },
    {
      consumption: 0.078,
      interval_start: '2020-02-16T00:00:00+01:00',
      interval_end: '2020-02-16T00:30:00+01:00',
    },
    {
      consumption: 0.056,
      interval_start: '2020-02-16T00:30:00+01:00',
      interval_end: '2020-02-16T01:00:00+01:00',
    },
  ],
};

export const accountRestFixture = {
  number: 'A-12345678',
  properties: [
    {
      id: 21321312,
      moved_in_at: '2026-01-22T00:00:00Z',
      moved_out_at: null,
      address_line_1: 'ADDRESS 1',
      address_line_2: 'ADDRESS 2',
      address_line_3: 'ADDRESS 3',
      town: 'TOWN',
      county: 'COUNTY',
      postcode: 'POSTCODE',
      electricity_meter_points: [
        {
          mpan: '10128536911',
          meters: [
            {
              serial_number: '123',
              registers: [
                {
                  identifier: '01',
                  rate: 'STANDARD',
                  is_settlement_register: true,
                },
              ],
            },
          ],
          agreements: [
            {
              tariff_code: 'E-1R-VAR-22-11-01-A',
              valid_from: '2024-02-22T00:00:00Z',
              valid_to: '2024-07-10T00:00:00+01:00',
            },
            {
              tariff_code: 'E-1R-AGILE-24-04-03-A',
              valid_from: '2024-07-10T00:00:00+01:00',
              valid_to: '2025-01-20T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-COSY-22-12-08-A',
              valid_from: '2025-01-20T00:00:00Z',
              valid_to: '2025-02-24T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-02-24T00:00:00Z',
              valid_to: '2025-03-12T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-GO-VAR-22-10-14-A',
              valid_from: '2025-03-12T00:00:00Z',
              valid_to: '2025-03-13T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-COSY-22-12-08-A',
              valid_from: '2025-03-13T00:00:00Z',
              valid_to: '2025-03-18T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-03-18T00:00:00Z',
              valid_to: '2025-03-20T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-03-20T00:00:00Z',
              valid_to: '2025-03-20T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-03-20T00:00:00Z',
              valid_to: '2025-03-20T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-03-20T00:00:00Z',
              valid_to: '2025-03-21T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-03-21T00:00:00Z',
              valid_to: '2025-03-21T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-03-21T00:00:00Z',
              valid_to: '2025-03-21T00:00:00Z',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-03-21T00:00:00Z',
              valid_to: '2025-03-31T00:00:00+01:00',
            },
            {
              tariff_code: 'E-1R-GO-VAR-22-10-14-A',
              valid_from: '2025-03-31T00:00:00+01:00',
              valid_to: '2025-04-02T00:00:00+01:00',
            },
            {
              tariff_code: 'E-1R-AGILE-24-10-01-A',
              valid_from: '2025-04-02T00:00:00+01:00',
              valid_to: '2026-04-02T00:00:00+01:00',
            },
          ],
          is_export: false,
        },
      ],
    },
  ],
};
