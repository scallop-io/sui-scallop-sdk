export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(private readonly capacity: number = 10) {
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
