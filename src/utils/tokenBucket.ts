import { DEFAULT_INTERVAL_IN_MS } from 'src/constants/tokenBucket';

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
  retryDelayInMs = DEFAULT_INTERVAL_IN_MS,
  maxRetries = 15,
  backoffFactor = 2 // The factor by which to increase the delay
): Promise<T | null> => {
  let retries = 0;

  const tryRequest = async (): Promise<T | null> => {
    if (tokenBucket.removeTokens(1)) {
      try {
        const result = await fn();

        // Check if the result is an object with status code (assuming the response has a status property)
        if (result && (result as any).status === 429) {
          throw new Error('Unexpected status code: 429');
        }

        return result;
      } catch (error: any) {
        if (
          error.message === 'Unexpected status code: 429' &&
          retries < maxRetries
        ) {
          retries++;
          const delay = retryDelayInMs * Math.pow(backoffFactor, retries);
          // console.warn(`429 encountered, retrying in ${delay} ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return tryRequest();
        } else {
          // console.error(error);
          console.error('An error occurred:', error.message);
          return null;
        }
      }
    } else if (retries < maxRetries) {
      retries++;
      const delay = retryDelayInMs * Math.pow(backoffFactor, retries);
      // console.warn(`Rate limit exceeded, retrying in ${delay} ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return tryRequest();
    } else {
      console.error('Maximum retries reached');
      return null;
    }
  };

  return tryRequest();
};

export { TokenBucket, callWithRateLimit };
