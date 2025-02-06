import { getPotentialCost, getTotalCost } from '../cost-calculator';
import { MatchingRateError } from '../../../errors/matching-rate-error';

describe('Cost Calculator', () => {
  it('should calculate the total cost based on the unit rates and service charge', () => {
    const example1 = getTotalCost({
      standingCharge: 100,
      unitRates: [
        { unitCostInPence: 1 },
        { unitCostInPence: 2 },
        { unitCostInPence: 3 },
        { unitCostInPence: 20 },
      ],
    });

    const example2 = getTotalCost({ standingCharge: 2, unitRates: [] });

    const example3 = getTotalCost({
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
    const example = getPotentialCost({
      potentialStandingCharge: 48.7881,
      todaysConsumptionUnitRates: [
        {
          readAt: '2025-02-28T00:30:00+00:00',
          consumptionDelta: 133,
          unitCostInPence: 2.962,
          readAtMs: 1740702600000,
        },
        {
          readAt: '2025-02-28T01:00:00+00:00',
          consumptionDelta: 89,
          unitCostInPence: 1.8821,
          readAtMs: 1740704400000,
        },
        {
          readAt: '2025-02-28T01:30:00+00:00',
          consumptionDelta: 87,
          unitCostInPence: 1.7347,
          readAtMs: 1740706200000,
        },
        {
          readAt: '2025-02-28T02:00:00+00:00',
          consumptionDelta: 69,
          unitCostInPence: 1.407,
          readAtMs: 1740708000000,
        },
        {
          readAt: '2025-02-28T02:30:00+00:00',
          consumptionDelta: 74,
          unitCostInPence: 1.4359,
          readAtMs: 1740709800000,
        },
        {
          readAt: '2025-02-28T03:00:00+00:00',
          consumptionDelta: 74,
          unitCostInPence: 1.4615,
          readAtMs: 1740711600000,
        },
        {
          readAt: '2025-02-28T03:30:00+00:00',
          consumptionDelta: 73,
          unitCostInPence: 1.3904,
          readAtMs: 1740713400000,
        },
        {
          readAt: '2025-02-28T04:00:00+00:00',
          consumptionDelta: 85,
          unitCostInPence: 1.7243,
          readAtMs: 1740715200000,
        },
        {
          readAt: '2025-02-28T04:30:00+00:00',
          consumptionDelta: 71,
          unitCostInPence: 1.453,
          readAtMs: 1740717000000,
        },
        {
          readAt: '2025-02-28T05:00:00+00:00',
          consumptionDelta: 85,
          unitCostInPence: 1.7332,
          readAtMs: 1740718800000,
        },
        {
          readAt: '2025-02-28T05:30:00+00:00',
          consumptionDelta: 70,
          unitCostInPence: 1.3892,
          readAtMs: 1740720600000,
        },
        {
          readAt: '2025-02-28T06:00:00+00:00',
          consumptionDelta: 756,
          unitCostInPence: 18.2098,
          readAtMs: 1740722400000,
        },
        {
          readAt: '2025-02-28T06:30:00+00:00',
          consumptionDelta: 152,
          unitCostInPence: 4.5039,
          readAtMs: 1740724200000,
        },
        {
          readAt: '2025-02-28T07:00:00+00:00',
          consumptionDelta: 75,
          unitCostInPence: 1.9766,
          readAtMs: 1740726000000,
        },
        {
          readAt: '2025-02-28T07:30:00+00:00',
          consumptionDelta: 127,
          unitCostInPence: 3.5004,
          readAtMs: 1740727800000,
        },
        {
          readAt: '2025-02-28T08:00:00+00:00',
          consumptionDelta: 138,
          unitCostInPence: 3.6515,
          readAtMs: 1740729600000,
        },
        {
          readAt: '2025-02-28T08:30:00+00:00',
          consumptionDelta: 114,
          unitCostInPence: 3.0117,
          readAtMs: 1740731400000,
        },
        {
          readAt: '2025-02-28T09:00:00+00:00',
          consumptionDelta: 122,
          unitCostInPence: 3.1743,
          readAtMs: 1740733200000,
        },
        {
          readAt: '2025-02-28T09:30:00+00:00',
          consumptionDelta: 155,
          unitCostInPence: 3.4796,
          readAtMs: 1740735000000,
        },
        {
          readAt: '2025-02-28T10:00:00+00:00',
          consumptionDelta: 234,
          unitCostInPence: 5.027,
          readAtMs: 1740736800000,
        },
        {
          readAt: '2025-02-28T10:30:00+00:00',
          consumptionDelta: 117,
          unitCostInPence: 2.3108,
          readAtMs: 1740738600000,
        },
        {
          readAt: '2025-02-28T11:00:00+00:00',
          consumptionDelta: 106,
          unitCostInPence: 1.9967,
          readAtMs: 1740740400000,
        },
        {
          readAt: '2025-02-28T11:30:00+00:00',
          consumptionDelta: 11,
          unitCostInPence: 0.1952,
          readAtMs: 1740742200000,
        },
      ],
      todaysPotentialUnitRates: [
        {
          valid_from: '2025-02-28T22:00:00Z',
          valid_to: '2025-03-01T00:00:00Z',
          validFromMs: 1740780000000,
          validToMs: 1740787200000,
          unitCostInPence: 13.23168,
        },
        {
          valid_from: '2025-02-28T19:00:00Z',
          valid_to: '2025-02-28T22:00:00Z',
          validFromMs: 1740769200000,
          validToMs: 1740780000000,
          unitCostInPence: 26.98143,
        },
        {
          valid_from: '2025-02-28T16:00:00Z',
          valid_to: '2025-02-28T19:00:00Z',
          validFromMs: 1740758400000,
          validToMs: 1740769200000,
          unitCostInPence: 40.47225,
        },
        {
          valid_from: '2025-02-28T13:00:00Z',
          valid_to: '2025-02-28T16:00:00Z',
          validFromMs: 1740747600000,
          validToMs: 1740758400000,
          unitCostInPence: 13.23168,
        },
        {
          valid_from: '2025-02-28T07:00:00Z',
          valid_to: '2025-02-28T13:00:00Z',
          validFromMs: 1740726000000,
          validToMs: 1740747600000,
          unitCostInPence: 26.98143,
        },
        {
          valid_from: '2025-02-28T04:00:00Z',
          valid_to: '2025-02-28T07:00:00Z',
          validFromMs: 1740715200000,
          validToMs: 1740726000000,
          unitCostInPence: 13.23168,
        },
        {
          valid_from: '2025-02-28T00:00:00Z',
          valid_to: '2025-02-28T04:00:00Z',
          validFromMs: 1740700800000,
          validToMs: 1740715200000,
          unitCostInPence: 26.98143,
        },
      ],
    });

    expect(example).toBe(113.5673);
  });

  it('should throw an error if there is no matching rate for a given half hourly rate', () => {
    const example = () =>
      getPotentialCost({
        potentialStandingCharge: 48.7881,
        todaysConsumptionUnitRates: [
          {
            readAt: '2025-02-28T11:30:00+00:00',
            consumptionDelta: 11,
            unitCostInPence: 0.1952,
            readAtMs: 1740742200000,
          },
        ],
        todaysPotentialUnitRates: [
          {
            valid_from: '2025-02-28T22:00:00Z',
            valid_to: '2025-03-01T00:00:00Z',
            validFromMs: 1740780000000,
            validToMs: 1740787200000,
            unitCostInPence: 13.23168,
          },
        ],
      });

    expect(example).toThrowError(MatchingRateError);
  });
});
