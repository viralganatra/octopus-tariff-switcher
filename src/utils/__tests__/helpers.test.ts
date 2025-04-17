import { expectTypeOf } from 'vitest';
import { makeUrl, scrubKeys, toIsoDateString, toIsoDateTime } from '../helpers';
import type { IsoDate, IsoDateTime, Url } from '../../types/misc';

describe('Utils -> Helpers', () => {
  it('should validate and return a date string', () => {
    expect(toIsoDateString('2025-01-01')).toBe('2025-01-01');
    expectTypeOf(toIsoDateString('2025-01-01')).toEqualTypeOf<IsoDate>();

    expect(() => {
      toIsoDateString('2025-01-01T00:00:00Z');
    }).toThrowError('Invalid ISO date format');
  });

  it('should validate and return a datetime string', () => {
    expect(toIsoDateTime('2025-01-01T00:00:00Z')).toBe('2025-01-01T00:00:00Z');
    expectTypeOf(toIsoDateTime('2025-01-01T00:00:00Z')).toEqualTypeOf<IsoDateTime>();

    expect(() => {
      toIsoDateTime('2025-01-01');
    }).toThrowError('Invalid ISO 8601 datetime format');
  });

  it('should validate and return a url string', () => {
    expect(makeUrl('https://example.com/foo/?bar=baz')).toBe('https://example.com/foo/?bar=baz');
    expectTypeOf(makeUrl('https://example.com/foo/?bar=baz')).toEqualTypeOf<Url>();

    expect(() => {
      makeUrl('test.com');
    }).toThrowError('Invalid URL: test.com');
  });

  it('should scrub keys from a given object', () => {
    const data = {
      number: 'number',
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
        },
      ],
      town: 'TOWN',
    };

    expect(
      scrubKeys({
        data,
        keysToScrub: [
          'moved_in_at',
          'moved_out_at',
          'address_line_1',
          'address_line_2',
          'address_line_3',
          'town',
          'county',
          'postcode',
        ],
      }),
    ).toMatchObject({
      number: 'number',
      properties: [
        {
          id: 21321312,
          address_line_1: '[SCRUBBED]',
          address_line_2: '[SCRUBBED]',
          address_line_3: '[SCRUBBED]',
          county: '[SCRUBBED]',
          moved_in_at: '[SCRUBBED]',
          moved_out_at: '[SCRUBBED]',
          postcode: '[SCRUBBED]',
          town: '[SCRUBBED]',
        },
      ],
      town: '[SCRUBBED]',
    });
  });
});
