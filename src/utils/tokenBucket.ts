class TokenBucket {
  private tokensPerInterval: number;
  private interval: number;
  private tokens: number;
  private lastRefill: number;

  constructor(tokensPerInterval: number, intervalInMs: number) {
    this.tokensPerInterval = tokensPerInterval;
    this.interval = intervalInMs;
    this.tokens = tokensPerInterval;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > this.interval) {
      const tokensToAdd =
        Math.floor(elapsed / this.interval) * this.tokensPerInterval;
      this.tokens = Math.min(this.tokens + tokensToAdd, this.tokensPerInterval);
      this.lastRefill = now;
    }
  }

  removeTokens(count: number) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
}

const callWithRateLimit = async <T>(
  tokenBucket: TokenBucket,
  fn: () => Promise<T>,
  retryDelayInMs = 200,
  maxRetries = 5 // Adding a maximum retries limit,
): Promise<T | null> => {
  let retries = 0;

  const tryRequest = async (): Promise<T | null> => {
    if (tokenBucket.removeTokens(1)) {
      return await fn();
    } else if (retries < maxRetries) {
      retries++;
      // Use a Promise to correctly handle the async operation with setTimeout
      await new Promise((resolve) => setTimeout(resolve, retryDelayInMs));
      return tryRequest();
    } else {
      // Optionally, handle the case where the maximum number of retries is reached
      console.error('Maximum retries reached');
      return null;
    }
  };

  return tryRequest();
};

export { TokenBucket, callWithRateLimit };
