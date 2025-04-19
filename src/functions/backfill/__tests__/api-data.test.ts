import type { IsoDate } from '../../../types/misc';
import type { EletricityAgreements } from '../schema';
import { enrichDatesWithTariffData, findMatchingTariffForDate } from '../api-data';
import { server } from '../../../mocks/node';
import { http, HttpResponse } from 'msw';
import {
  consumptionAgileFixture,
  standingChargeAgileFixture,
  unitRatesFixture,
} from '../../../mocks/fixtures';
import { setCachedProducts } from '../../tariff-switcher/cache';

describe('Finding matching tariffs', () => {
  it('should find the correct tariff for a given date', () => {
    const pastTariffs = [
      {
        validFrom: '2025-01-01T00:00:00Z',
        validTo: '2025-03-01T00:00:00Z',
        tariffCode: 'TARIFF-A',
      },
      {
        validFrom: '2025-03-01T00:00:00Z',
        validTo: '2025-06-01T00:00:00Z',
        tariffCode: 'TARIFF-B',
      },
      {
        validFrom: '2025-06-01T00:00:00Z',
        validTo: '2025-12-31T00:00:00Z',
        tariffCode: 'TARIFF-C',
      },
    ] as EletricityAgreements;

    const result = findMatchingTariffForDate({
      pastTariffs,
      isoDate: '2025-04-15' as IsoDate,
    });

    expect(result).toEqual({
      validFrom: '2025-03-01T00:00:00Z',
      validTo: '2025-06-01T00:00:00Z',
      tariffCode: 'TARIFF-B',
    });
  });

  it('should throw an error when no matching tariff is found', () => {
    const pastTariffs = [
      {
        validFrom: '2025-01-01T00:00:00Z',
        validTo: '2025-03-01T00:00:00Z',
        tariffCode: 'TARIFF-A',
      },
    ] as EletricityAgreements;

    expect(() => {
      findMatchingTariffForDate({
        pastTariffs,
        isoDate: '2025-04-15' as IsoDate,
      });
    }).toThrowError('Unable to find matching tariff for date: 2025-04-15');
  });

  it('should handle boundary dates correctly (exclusive end)', () => {
    const pastTariffs = [
      {
        validFrom: '2025-01-01T00:00:00Z',
        validTo: '2025-03-01T00:00:00Z',
        tariffCode: 'TARIFF-A',
      },
      {
        validFrom: '2025-03-01T00:00:00Z',
        validTo: '2025-06-01T00:00:00Z',
        tariffCode: 'TARIFF-B',
      },
    ] as EletricityAgreements;

    // Start of period should be included
    const resultStart = findMatchingTariffForDate({
      pastTariffs,
      isoDate: '2025-03-01' as IsoDate,
    });
    expect(resultStart.tariffCode).toBe('TARIFF-B');

    // End of period should be excluded
    expect(() => {
      findMatchingTariffForDate({
        pastTariffs,
        isoDate: '2025-06-01' as IsoDate,
      });
    }).toThrow();
  });
});

describe('Enrich dates with tariff data', () => {
  beforeEach(() => {
    setCachedProducts([]);
  });

  const pastTariffs = [
    {
      validFrom: '2020-01-01T00:00:00Z',
      validTo: '2024-03-01T00:00:00Z',
      tariffCode: 'E-1R-COSY-22-12-08-A',
    },
    {
      validFrom: '2025-03-01T00:00:00Z',
      validTo: '2025-06-01T00:00:00Z',
      tariffCode: 'E-1R-AGILE-24-10-01-A',
    },
  ] as EletricityAgreements;
  const dates = ['2020-02-15', '2025-04-15'] as IsoDate[];
  const mpan = '123456789';
  const serialNumber = 'SN12345';

  it('should enrich dates with tariff data', async () => {
    const data = await enrichDatesWithTariffData({ dates, pastTariffs, mpan, serialNumber });

    expect(data.size).toBe(2);

    const data2020 = data.get('2020-02-15' as IsoDate);
    expect(data2020?.isoDate).toBe('2020-02-15');
    expect(data2020?.productCode).toBe('COSY-22-12-08');
    expect(data2020?.tariffCode).toBe('E-1R-COSY-22-12-08-A');
    expect(data2020?.standingCharge).toBe(147.6062);
    expect(data2020?.tariffName).toBe('Cosy Octopus');
    expect(data2020?.consumption).matchSnapshot('Cosy consumption');
    expect(data2020?.unitRates).matchSnapshot('Cosy unit rates');

    const data2025 = data.get('2025-04-15' as IsoDate);
    expect(data2025?.isoDate).toBe('2025-04-15');
    expect(data2025?.productCode).toBe('AGILE-24-10-01');
    expect(data2025?.tariffCode).toBe('E-1R-AGILE-24-10-01-A');
    expect(data2025?.standingCharge).toBe(47.6062);
    expect(data2025?.tariffName).toBe('Agile Octopus');
    expect(data2025?.consumption).matchSnapshot('Agile consumption');
    expect(data2025?.unitRates).matchSnapshot('Agile unit rates');
  });

  it('should throw error when tariff is not found', async () => {
    const invalidPastTariffs = [
      {
        validFrom: '2020-01-01T00:00:00Z',
        validTo: '2024-03-01T00:00:00Z',
        tariffCode: 'E-1R-TEST-22-12-08-A',
      },
      {
        validFrom: '2025-03-01T00:00:00Z',
        validTo: '2025-06-01T00:00:00Z',
        tariffCode: 'E-1R-FOO-24-10-01-A',
      },
    ] as EletricityAgreements;

    await expect(
      enrichDatesWithTariffData({ dates, mpan, serialNumber, pastTariffs: invalidPastTariffs }),
    ).rejects.toThrowError('No matching tariff for: E-1R-TEST-22-12-08-A');
  });

  it('should handle batching for multiple dates', async () => {
    // Generate dates to test batching
    const manyDates = Array.from(
      { length: 30 },
      (_, i) => `2025-03-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    ) as IsoDate[];

    // Track request counts
    let standingChargeRequests = 0;
    let unitRateRequests = 0;
    let consumptionRequests = 0;

    server.use(
      http.get(
        'https://api.octopus.energy/v1/products/:productCode/electricity-tariffs/:tariffCode/standard-unit-rates',
        () => {
          unitRateRequests += 1;
          return HttpResponse.json(unitRatesFixture());
        },
      ),
      http.get(
        'https://api.octopus.energy/v1/products/:productCode/electricity-tariffs/:tariffCode/standing-charges/',
        () => {
          standingChargeRequests += 1;
          return HttpResponse.json(standingChargeAgileFixture);
        },
      ),
      http.get(
        'https://api.octopus.energy/v1/electricity-meter-points/:mpan/meters/:serialNumber/consumption/',
        () => {
          consumptionRequests += 1;
          return HttpResponse.json(consumptionAgileFixture());
        },
      ),
    );

    const promise = enrichDatesWithTariffData({
      dates: manyDates,
      pastTariffs: [
        {
          validFrom: '2025-01-01T00:00:00Z',
          validTo: '2026-12-01T00:00:00Z',
          tariffCode: 'E-1R-AGILE-24-10-01-A',
        },
      ],
      mpan,
      serialNumber,
    });

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result.size).toBe(30);
    expect(standingChargeRequests).toBe(30);
    expect(unitRateRequests).toBe(30);
    expect(consumptionRequests).toBe(30);
  });
});
