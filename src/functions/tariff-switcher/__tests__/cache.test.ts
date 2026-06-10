import { getCachedToken, setCachedToken } from '../cache';

describe('Token cache', () => {
  it('should return the cached token before the TTL expires', () => {
    setCachedToken('fresh-token');

    vi.advanceTimersByTime(44 * 60 * 1000);

    expect(getCachedToken()).toBe('fresh-token');
  });

  it('should return undefined once the TTL has expired', () => {
    setCachedToken('stale-token');

    vi.advanceTimersByTime(45 * 60 * 1000);

    expect(getCachedToken()).toBeUndefined();
  });
});
