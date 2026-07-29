import { RateLimiter } from 'src/datasources/rateLimiter.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Use fake timers and initialize system time to a known value.
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('acquires a token immediately when tokens are available', async () => {
    // Create a limiter with capacity 5.
    const limiter = new RateLimiter(5);

    // The very first call should return immediately.
    const start = Date.now();
    await limiter.acquireToken();
    const end = Date.now();

    // Since tokens are available, no significant delay should occur.
    expect(end - start).toBeLessThan(10);
  });

  // `tokensPerSecond: Infinity` is how callers say "throttling happens
  // elsewhere, don't rate limit". It used to deadlock: an infinite refillRate
  // makes two same-millisecond refills compute `0 * Infinity === NaN`, NaN is
  // absorbing through `Math.min`, so `tokens >= 1` never held again and
  // `acquireToken` spun forever on `setTimeout(fn, NaN)`. A burst of reads
  // (a dashboard refresh) hit the same-millisecond case reliably and every
  // dependent query hung with no error.
  it('never blocks when capacity is Infinity, even for a same-tick burst', async () => {
    const limiter = new RateLimiter(Infinity);

    // All in one tick, so multiple refills land in the same millisecond.
    const results = await Promise.all(
      Array.from({ length: 200 }, (_, i) => limiter.execute(async () => i))
    );

    expect(results).toHaveLength(200);
    expect(results[199]).toBe(199);
  });

  // A FINITE capacity below 1 slips past the `unlimited` check but can never hand out
  // a token, so `acquireToken` never resolves:
  //   0    -> Math.ceil(1/0) === Infinity, a setTimeout delay clamped to ~1ms: spins
  //   -1   -> negative delay, coerced to 0: spins
  //   0.5  -> the wait is finite and correct, but `refill` caps tokens at `capacity`,
  //           so the bucket never reaches the whole token required: loops forever
  // A library that silently hangs every read leaves nothing to debug, so construction
  // must reject these rather than accept them.
  it.each([0, -1, 0.5, 0.999])(
    'rejects capacity %s at construction instead of hanging',
    (capacity) => {
      expect(() => new RateLimiter(capacity)).toThrow(/capacity must be >= 1/);
    }
  );

  it('accepts the smallest usable capacity of exactly 1', async () => {
    // intent: the guard must not over-reject the boundary — 1 token/s is valid.
    const limiter = new RateLimiter(1);
    await expect(limiter.acquireToken()).resolves.toBeUndefined();
  });

  it('never blocks when capacity is not a number', async () => {
    const limiter = new RateLimiter(NaN);
    await expect(limiter.execute(async () => 'ok')).resolves.toBe('ok');
  });

  it('waits for a token when none are available', async () => {
    const capacity = 3;
    const limiter = new RateLimiter(capacity);

    // Exhaust the available tokens.
    await limiter.acquireToken();
    await limiter.acquireToken();
    await limiter.acquireToken();

    // The next call should have to wait.
    const promise = limiter.acquireToken();
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    // Advance time by a small amount (e.g., 200ms) which is likely insufficient for a token refill.
    vi.advanceTimersByTime(200);
    // Let microtasks run.
    await Promise.resolve();
    expect(resolved).toBe(false);

    // Calculate the time needed to acquire one token.
    // With capacity 3, refillRate = 3/1000 tokens per ms so we need:
    // Math.ceil(1 / (3/1000)) = Math.ceil(1000/3) ≈ 334ms.
    vi.advanceTimersByTime(334);
    await promise;
    expect(resolved).toBe(true);
  });

  it('executes a provided function after acquiring a token', async () => {
    // Use a limiter with a capacity of 1 so that successive calls need to wait.
    const limiter = new RateLimiter(1);
    const mockFn = vi.fn(async () => 'result');

    // First execution uses a token immediately.
    const result1 = await limiter.execute(mockFn);
    expect(result1).toBe('result');
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Second execution should wait until a token is refilled.
    const promise2 = limiter.execute(mockFn);
    let secondCalled = false;
    promise2.then(() => {
      secondCalled = true;
    });

    // Advance time by half the needed duration (for capacity 1, refillRate = 1/1000, so 1000ms is needed for a token).
    vi.advanceTimersByTime(500);
    // Let pending microtasks settle.
    await Promise.resolve();
    expect(secondCalled).toBe(false);

    // Advance the remaining time to allow token refill.
    vi.advanceTimersByTime(500);
    const result2 = await promise2;
    expect(result2).toBe('result');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('allows multiple tokens to be acquired over time', async () => {
    // With a capacity of 2, two tokens are available immediately.
    const capacity = 2;
    const limiter = new RateLimiter(capacity);

    const results = [
      limiter.execute(async () => 'first'),
      limiter.execute(async () => 'second'),
      limiter.execute(async () => 'third'), // This call should wait.
    ];

    // Immediately advance timers by 0ms to allow any immediate promises to settle.
    vi.advanceTimersByTime(0);
    await Promise.resolve();

    // The first two executions should resolve immediately.
    await expect(results[0]).resolves.toBe('first');
    await expect(results[1]).resolves.toBe('second');

    // The third promise should still be pending.
    let thirdResolved = false;
    results[2].then(() => {
      thirdResolved = true;
    });
    await Promise.resolve();
    expect(thirdResolved).toBe(false);

    // With capacity 2, the refillRate = 2/1000 tokens per ms.
    // Time required for one token: Math.ceil(1 / (2/1000)) = Math.ceil(500) = 500ms.
    vi.advanceTimersByTime(500);
    await results[2];
    expect(thirdResolved).toBe(true);
  });
});
