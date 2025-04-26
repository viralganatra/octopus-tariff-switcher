import { MatchingRateError } from '../../../errors/matching-rate-error';
import {
  getDailyUsageCostByTariff,
  getDailyCostInPence,
  getUnitRatesWithCost,
} from '../cost-calculator';

describe('Cost Calculator', () => {
  it('should calculate the total cost based on the unit rates and service charge', () => {
    const example1 = getDailyCostInPence({
      standingCharge: 100,
      unitRates: [
        { unitCostInPence: 1 },
        { unitCostInPence: 2 },
        { unitCostInPence: 3 },
        { unitCostInPence: 20 },
      ],
    });

    const example2 = getDailyCostInPence({ standingCharge: 2, unitRates: [] });

    const example3 = getDailyCostInPence({
      standingCharge: 100,
      unitRates: [
        { unitCostInPence: 1.02 },
        { unitCostInPence: 2.2444244244 },
        { unitCostInPence: 3.22332323 },
      ],
    });

    expect(example1).toBe(126);
    expect(example2).toBe(2);
    expect(example3).toBe(106.4877);
  });

  it('should calculate the potential cost based upon todays potential and actual rates', () => {
    const example = getDailyUsageCostByTariff({
      standingCharge: 48.7881,
      consumptionUnitRates: [
        {
          readAt: '2025-02-28T00:30:00+00:00',
          consumptionDelta: 133,
          readAtMs: 1740702600000,
        },
        {
          readAt: '2025-02-28T01:00:00+00:00',
          consumptionDelta: 89,
          readAtMs: 1740704400000,
        },
        {
          readAt: '2025-02-28T01:30:00+00:00',
          consumptionDelta: 87,
          readAtMs: 1740706200000,
        },
        {
          readAt: '2025-02-28T02:00:00+00:00',
          consumptionDelta: 69,
          readAtMs: 1740708000000,
        },
        {
          readAt: '2025-02-28T02:30:00+00:00',
          consumptionDelta: 74,
          readAtMs: 1740709800000,
        },
        {
          readAt: '2025-02-28T03:00:00+00:00',
          consumptionDelta: 74,
          readAtMs: 1740711600000,
        },
        {
          readAt: '2025-02-28T03:30:00+00:00',
          consumptionDelta: 73,
          readAtMs: 1740713400000,
        },
        {
          readAt: '2025-02-28T04:00:00+00:00',
          consumptionDelta: 85,
          readAtMs: 1740715200000,
        },
        {
          readAt: '2025-02-28T04:30:00+00:00',
          consumptionDelta: 71,
          readAtMs: 1740717000000,
        },
        {
          readAt: '2025-02-28T05:00:00+00:00',
          consumptionDelta: 85,
          readAtMs: 1740718800000,
        },
        {
          readAt: '2025-02-28T05:30:00+00:00',
          consumptionDelta: 70,
          readAtMs: 1740720600000,
        },
        {
          readAt: '2025-02-28T06:00:00+00:00',
          consumptionDelta: 756,
          readAtMs: 1740722400000,
        },
        {
          readAt: '2025-02-28T06:30:00+00:00',
          consumptionDelta: 152,
          readAtMs: 1740724200000,
        },
        {
          readAt: '2025-02-28T07:00:00+00:00',
          consumptionDelta: 75,
          readAtMs: 1740726000000,
        },
        {
          readAt: '2025-02-28T07:30:00+00:00',
          consumptionDelta: 127,
          readAtMs: 1740727800000,
        },
        {
          readAt: '2025-02-28T08:00:00+00:00',
          consumptionDelta: 138,
          readAtMs: 1740729600000,
        },
        {
          readAt: '2025-02-28T08:30:00+00:00',
          consumptionDelta: 114,
          readAtMs: 1740731400000,
        },
        {
          readAt: '2025-02-28T09:00:00+00:00',
          consumptionDelta: 122,
          readAtMs: 1740733200000,
        },
        {
          readAt: '2025-02-28T09:30:00+00:00',
          consumptionDelta: 155,
          readAtMs: 1740735000000,
        },
        {
          readAt: '2025-02-28T10:00:00+00:00',
          consumptionDelta: 234,
          readAtMs: 1740736800000,
        },
        {
          readAt: '2025-02-28T10:30:00+00:00',
          consumptionDelta: 117,
          readAtMs: 1740738600000,
        },
        {
          readAt: '2025-02-28T11:00:00+00:00',
          consumptionDelta: 106,
          readAtMs: 1740740400000,
        },
        {
          readAt: '2025-02-28T11:30:00+00:00',
          consumptionDelta: 11,
          readAtMs: 1740742200000,
        },
      ],
      tariffUnitRates: [
        {
          validFrom: '2025-02-28T22:00:00Z',
          validTo: '2025-03-01T00:00:00Z',
          validFromMs: 1740780000000,
          validToMs: 1740787200000,
          unitCostInPence: 13.23168,
        },
        {
          validFrom: '2025-02-28T19:00:00Z',
          validTo: '2025-02-28T22:00:00Z',
          validFromMs: 1740769200000,
          validToMs: 1740780000000,
          unitCostInPence: 26.98143,
        },
        {
          validFrom: '2025-02-28T16:00:00Z',
          validTo: '2025-02-28T19:00:00Z',
          validFromMs: 1740758400000,
          validToMs: 1740769200000,
          unitCostInPence: 40.47225,
        },
        {
          validFrom: '2025-02-28T13:00:00Z',
          validTo: '2025-02-28T16:00:00Z',
          validFromMs: 1740747600000,
          validToMs: 1740758400000,
          unitCostInPence: 13.23168,
        },
        {
          validFrom: '2025-02-28T07:00:00Z',
          validTo: '2025-02-28T13:00:00Z',
          validFromMs: 1740726000000,
          validToMs: 1740747600000,
          unitCostInPence: 26.98143,
        },
        {
          validFrom: '2025-02-28T04:00:00Z',
          validTo: '2025-02-28T07:00:00Z',
          validFromMs: 1740715200000,
          validToMs: 1740726000000,
          unitCostInPence: 13.23168,
        },
        {
          validFrom: '2025-02-28T00:00:00Z',
          validTo: '2025-02-28T04:00:00Z',
          validFromMs: 1740700800000,
          validToMs: 1740715200000,
          unitCostInPence: 26.98143,
        },
      ],
    });

    expect(example).toBe(113.4298);
  });

  it('should calculate the unit rates with cost', () => {
    const example = getUnitRatesWithCost({
      consumptionUnitRates: [
        {
          readAt: '2025-02-28T00:30:00+00:00',
          consumptionDelta: 133,
          readAtMs: 1740702600000,
        },
        {
          readAt: '2025-02-28T01:00:00+00:00',
          consumptionDelta: 89,
          readAtMs: 1740704400000,
        },
        {
          readAt: '2025-02-28T01:30:00+00:00',
          consumptionDelta: 87,
          readAtMs: 1740706200000,
        },
        {
          readAt: '2025-02-28T02:00:00+00:00',
          consumptionDelta: 69,
          readAtMs: 1740708000000,
        },
        {
          readAt: '2025-02-28T02:30:00+00:00',
          consumptionDelta: 74,
          readAtMs: 1740709800000,
        },
        {
          readAt: '2025-02-28T03:00:00+00:00',
          consumptionDelta: 74,
          readAtMs: 1740711600000,
        },
        {
          readAt: '2025-02-28T03:30:00+00:00',
          consumptionDelta: 73,
          readAtMs: 1740713400000,
        },
        {
          readAt: '2025-02-28T04:00:00+00:00',
          consumptionDelta: 85,
          readAtMs: 1740715200000,
        },
        {
          readAt: '2025-02-28T04:30:00+00:00',
          consumptionDelta: 71,
          readAtMs: 1740717000000,
        },
        {
          readAt: '2025-02-28T05:00:00+00:00',
          consumptionDelta: 85,
          readAtMs: 1740718800000,
        },
        {
          readAt: '2025-02-28T05:30:00+00:00',
          consumptionDelta: 70,
          readAtMs: 1740720600000,
        },
        {
          readAt: '2025-02-28T06:00:00+00:00',
          consumptionDelta: 756,
          readAtMs: 1740722400000,
        },
        {
          readAt: '2025-02-28T06:30:00+00:00',
          consumptionDelta: 152,
          readAtMs: 1740724200000,
        },
        {
          readAt: '2025-02-28T07:00:00+00:00',
          consumptionDelta: 75,
          readAtMs: 1740726000000,
        },
        {
          readAt: '2025-02-28T07:30:00+00:00',
          consumptionDelta: 127,
          readAtMs: 1740727800000,
        },
        {
          readAt: '2025-02-28T08:00:00+00:00',
          consumptionDelta: 138,
          readAtMs: 1740729600000,
        },
        {
          readAt: '2025-02-28T08:30:00+00:00',
          consumptionDelta: 114,
          readAtMs: 1740731400000,
        },
        {
          readAt: '2025-02-28T09:00:00+00:00',
          consumptionDelta: 122,
          readAtMs: 1740733200000,
        },
        {
          readAt: '2025-02-28T09:30:00+00:00',
          consumptionDelta: 155,
          readAtMs: 1740735000000,
        },
        {
          readAt: '2025-02-28T10:00:00+00:00',
          consumptionDelta: 234,
          readAtMs: 1740736800000,
        },
        {
          readAt: '2025-02-28T10:30:00+00:00',
          consumptionDelta: 117,
          readAtMs: 1740738600000,
        },
        {
          readAt: '2025-02-28T11:00:00+00:00',
          consumptionDelta: 106,
          readAtMs: 1740740400000,
        },
        {
          readAt: '2025-02-28T11:30:00+00:00',
          consumptionDelta: 11,
          readAtMs: 1740742200000,
        },
      ],
      tariffUnitRates: [
        {
          validFrom: '2025-02-28T22:00:00Z',
          validTo: '2025-03-01T00:00:00Z',
          validFromMs: 1740780000000,
          validToMs: 1740787200000,
          unitCostInPence: 13.23168,
        },
        {
          validFrom: '2025-02-28T19:00:00Z',
          validTo: '2025-02-28T22:00:00Z',
          validFromMs: 1740769200000,
          validToMs: 1740780000000,
          unitCostInPence: 26.98143,
        },
        {
          validFrom: '2025-02-28T16:00:00Z',
          validTo: '2025-02-28T19:00:00Z',
          validFromMs: 1740758400000,
          validToMs: 1740769200000,
          unitCostInPence: 40.47225,
        },
        {
          validFrom: '2025-02-28T13:00:00Z',
          validTo: '2025-02-28T16:00:00Z',
          validFromMs: 1740747600000,
          validToMs: 1740758400000,
          unitCostInPence: 13.23168,
        },
        {
          validFrom: '2025-02-28T07:00:00Z',
          validTo: '2025-02-28T13:00:00Z',
          validFromMs: 1740726000000,
          validToMs: 1740747600000,
          unitCostInPence: 26.98143,
        },
        {
          validFrom: '2025-02-28T04:00:00Z',
          validTo: '2025-02-28T07:00:00Z',
          validFromMs: 1740715200000,
          validToMs: 1740726000000,
          unitCostInPence: 13.23168,
        },
        {
          validFrom: '2025-02-28T00:00:00Z',
          validTo: '2025-02-28T04:00:00Z',
          validFromMs: 1740700800000,
          validToMs: 1740715200000,
          unitCostInPence: 26.98143,
        },
      ],
    });

    expect(example).toMatchSnapshot();
  });

  it('should throw an error if there is no matching rate for a given half hourly rate', () => {
    const example = () =>
      getDailyUsageCostByTariff({
        standingCharge: 48.7881,
        consumptionUnitRates: [
          {
            readAt: '2025-02-28T11:30:00+00:00',
            consumptionDelta: 11,
            readAtMs: 1740742200000,
          },
        ],
        tariffUnitRates: [
          {
            validFrom: '2025-02-28T22:00:00Z',
            validTo: '2025-03-01T00:00:00Z',
            validFromMs: 1740780000000,
            validToMs: 1740787200000,
            unitCostInPence: 13.23168,
          },
        ],
      });

    expect(example).toThrowError(MatchingRateError);
  });
});
