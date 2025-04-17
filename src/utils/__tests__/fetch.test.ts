import { retryWithExponentialBackoff } from '../fetch';

describe('Fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve on first attempt with no retries', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await retryWithExponentialBackoff(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry once before succeeding', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const promise = retryWithExponentialBackoff(mockFn);

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries and apply exponential delays', async () => {
    const rejectSpy = vi.fn();
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    retryWithExponentialBackoff(mockFn, { retries: 2, delayMs: 100 }).catch(rejectSpy);

    await vi.runAllTimersAsync();

    expect(rejectSpy).toHaveBeenCalledOnce();
    expect(mockFn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should apply exponential backoff: 100ms, 200ms, 400ms', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('fail 3'))
      .mockResolvedValueOnce('success');

    const spy = vi.spyOn(global, 'setTimeout');
    const promise = retryWithExponentialBackoff(mockFn, { delayMs: 100 });

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(4);

    expect(spy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(spy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    expect(spy).toHaveBeenNthCalledWith(3, expect.any(Function), 400);
  });
});
