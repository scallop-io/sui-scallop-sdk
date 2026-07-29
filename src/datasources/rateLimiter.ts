export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly refillRate: number; // tokens per millisecond

  /**
   * `Infinity` (or any non-finite capacity) means "do not rate limit" — callers
   * pass it when throttling already happens at a higher layer.
   *
   * It must short-circuit rather than flow through the token math: with an
   * infinite `refillRate`, two refills inside the same millisecond compute
   * `0 * Infinity === NaN`, and `NaN` is absorbing here — `Math.min(Infinity,
   * NaN + x)` stays `NaN` forever, so `tokens >= 1` is permanently false and
   * `acquireToken` spins on `setTimeout(fn, NaN)` (delay coerced to 0) without
   * ever resolving. That turns a request burst into a permanently pending
   * promise instead of an unthrottled pass-through.
   */
  private readonly unlimited: boolean;

  constructor(private readonly capacity: number = 10) {
    this.unlimited = !Number.isFinite(capacity);
    // A finite capacity below 1 passes the `unlimited` check but can never hand out
    // a token, so `acquireToken` never resolves:
    //   - `0` computes `Math.ceil(1 / 0) === Infinity`, a `setTimeout` delay that
    //     overflows and is clamped to ~1ms, so it spins;
    //   - a negative computes a negative delay, coerced to 0, so it spins;
    //   - a fraction like `0.5` is subtler — the wait is finite and correct, but
    //     `refill` caps tokens at `capacity`, so the bucket never reaches the whole
    //     token `acquireToken` requires and it loops forever.
    // Capacity doubles as burst size and refill rate here, so sub-1 rates are simply
    // not expressible; a caller wanting one request every few seconds has to throttle
    // upstream. Refuse it at construction: a library that silently hangs every read
    // leaves nothing to debug, so this must fail loudly rather than politely.
    if (!this.unlimited && !(capacity >= 1)) {
      throw new Error(
        `RateLimiter: capacity must be >= 1 token/second (received ${capacity}). ` +
          `Pass Infinity to disable throttling, or throttle upstream for sub-1 rates.`
      );
    }
    this.refillRate = this.capacity / 1000; // 10 tokens per second = 0.01 tokens/ms
    this.tokens = this.capacity;
    this.lastRefillTime = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefillTime = now;
  }

  private getTimeToNextToken(): number {
    this.refill();

    if (this.tokens >= 1) {
      return 0;
    }

    // Calculate exact milliseconds needed for 1 full token
    const deficit = 1 - this.tokens;
    return Math.ceil(deficit / this.refillRate);
  }

  async acquireToken(): Promise<void> {
    if (this.unlimited) return;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const waitTime = this.getTimeToNextToken();

      if (waitTime === 0) {
        if (this.tokens >= 1) {
          this.tokens -= 1;
          return;
        }
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.refill();
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireToken();
    return await fn();
  }
}
