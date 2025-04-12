import { expectTypeOf } from 'vitest';
import { makeUrl, toIsoDateString, toIsoDateTime } from '../helpers';
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
});
