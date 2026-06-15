import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnChainDataSource } from './onchain.js';

// A fake transport client whose methods resolve immediately; we only assert the
// rate limiter gates them, so the actual payloads are irrelevant.
const makeClient = () => {
  const getObjects = vi.fn(async () => ({ objects: [{ objectId: '0xA' }] }));
  const simulateTransaction = vi.fn(async () => ({ ok: true }));
  // The test client only implements the two methods these cases exercise; it's
  // cast to the client shape at the constructor call site.
  return { getObjects, simulateTransaction };
};

describe('OnChainDataSource rate limiting', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('throttles direct client method calls beyond the per-second budget', async () => {
    // intent: repo reads hit onchain.client.<m> directly — those MUST be limited
    const client = makeClient();
    const ds = new OnChainDataSource({
      client: client as never,
      url: 'x',
      tokensPerSecond: 2,
    });

    // Bucket starts full (capacity 2): first 2 resolve without advancing time.
    await ds.client.simulateTransaction({} as never);
    await ds.client.simulateTransaction({} as never);
    expect(client.simulateTransaction).toHaveBeenCalledTimes(2);

    // The 3rd must wait for a token to refill (~500ms at 2/s) — it stays pending
    // until time advances.
    const third = ds.client.simulateTransaction({} as never);
    let settled = false;
    void third.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(client.simulateTransaction).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(600);
    await third;
    expect(client.simulateTransaction).toHaveBeenCalledTimes(3);
  });

  it('routes the getObject convenience through the same limiter', async () => {
    // intent: getObject calls this.client.getObjects, so it shares the budget
    const client = makeClient();
    const ds = new OnChainDataSource({
      client: client as never,
      url: 'x',
      tokensPerSecond: 1,
    });

    await ds.getObject({ objectId: '0xA' } as never);
    expect(client.getObjects).toHaveBeenCalledTimes(1);

    const second = ds.getObject({ objectId: '0xA' } as never);
    let settled = false;
    void second.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1100);
    await second;
    expect(client.getObjects).toHaveBeenCalledTimes(2);
  });
});
