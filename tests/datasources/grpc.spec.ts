import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import {
  getRpcStats,
  resetRpcStats,
  collectRpcStats,
} from 'src/datasources/rpcStats.js';

// A fake transport client whose methods resolve immediately; we only assert the
// rate limiter gates them, so the actual payloads are irrelevant.
const makeClient = () => {
  const getObjects = vi.fn(async () => ({ objects: [{ objectId: '0xA' }] }));
  const simulateTransaction = vi.fn(async () => ({ ok: true }));
  // The test client only implements the two methods these cases exercise; it's
  // cast to the client shape at the constructor call site.
  return { getObjects, simulateTransaction };
};

describe('GrpcDataSource rate limiting', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('throttles direct client method calls beyond the per-second budget', async () => {
    // intent: repo reads hit onchain.client.<m> directly — those MUST be limited
    const client = makeClient();
    const ds = new GrpcDataSource({
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
    const ds = new GrpcDataSource({
      client: client as never,
      url: 'x',
      tokensPerSecond: 1,
    });

    // getObject now coalesces on a macrotask window, so drive the fake clock to
    // flush the pending batch before the read resolves.
    const first = ds.getObject({ objectId: '0xA' } as never);
    await vi.advanceTimersByTimeAsync(1);
    await first;
    expect(client.getObjects).toHaveBeenCalledTimes(1);

    const second = ds.getObject({ objectId: '0xA' } as never);
    let settled = false;
    void second.then(() => {
      settled = true;
    });
    // The flush fires, but the limiter has no token left — the batched
    // getObjects stays pending until a token refills.
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(false);
    expect(client.getObjects).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1100);
    await second;
    expect(client.getObjects).toHaveBeenCalledTimes(2);
  });

  it('coalesces same-tick getObject reads into one deduped batch', async () => {
    // intent: N single reads fired in one tick (incl. duplicates) must collapse
    // into a SINGLE getObjects call carrying each id exactly once — this is the
    // fix for the BatchGetObjects-of-1 spam.
    const getObjects = vi.fn(
      async ({ objectIds }: { objectIds: string[] }) => ({
        objects: objectIds.map((objectId) => ({ objectId })),
      })
    );
    const ds = new GrpcDataSource({
      client: { getObjects } as never,
      url: 'x',
      tokensPerSecond: 100,
    });

    const batch = Promise.all([
      ds.getObject({ objectId: '0xA' } as never),
      ds.getObject({ objectId: '0xB' } as never),
      ds.getObject({ objectId: '0xA' } as never), // byte-identical duplicate
    ]);
    await vi.advanceTimersByTimeAsync(1); // flush the coalescing window
    const [a, b, aDup] = await batch;

    // One network round-trip for all three reads.
    expect(getObjects).toHaveBeenCalledTimes(1);
    // Duplicate id deduped: the batch carries A and B once each.
    expect(getObjects.mock.calls[0][0].objectIds).toEqual(['0xA', '0xB']);
    // Each caller still receives its object; the duplicate shares A's result.
    expect((a as { object: { objectId: string } }).object.objectId).toBe('0xA');
    expect((b as { object: { objectId: string } }).object.objectId).toBe('0xB');
    expect((aDup as { object: { objectId: string } }).object.objectId).toBe(
      '0xA'
    );
  });

  it('splits coalesced reads into separate batches per include selection', async () => {
    // intent: getObjects carries one `include` per call, so reads requesting
    // different fields cannot share a batch — but same-selection reads still do.
    const getObjects = vi.fn(
      async ({ objectIds }: { objectIds: string[] }) => ({
        objects: objectIds.map((objectId) => ({ objectId })),
      })
    );
    const ds = new GrpcDataSource({
      client: { getObjects } as never,
      url: 'x',
      tokensPerSecond: 100,
    });

    const batch = Promise.all([
      ds.getObject({ objectId: '0xA', include: { json: true } } as never),
      ds.getObject({ objectId: '0xB', include: { json: true } } as never),
      ds.getObject({ objectId: '0xC', include: { type: true } } as never),
    ]);
    await vi.advanceTimersByTimeAsync(1); // flush the coalescing window
    await batch;

    // Two batches: {json} group [A,B] and {type} group [C].
    expect(getObjects).toHaveBeenCalledTimes(2);
  });

  it('coalesces reads scattered across await continuations (timer window)', async () => {
    // intent: the regression this fixes — reads issued in DIFFERENT microtasks
    // (each preceded by an awaited continuation, as when `fetchWithCache`
    // interposes) still merge into ONE batch under the default macrotask window.
    // A microtask-only flush would split these into three getObjects-of-1.
    const getObjects = vi.fn(
      async ({ objectIds }: { objectIds: string[] }) => ({
        objects: objectIds.map((objectId) => ({ objectId })),
      })
    );
    const ds = new GrpcDataSource({
      client: { getObjects } as never,
      url: 'x',
      tokensPerSecond: 100,
    });

    const scattered = Promise.all(
      ['0xA', '0xB', '0xC'].map(async (objectId) => {
        await Promise.resolve(); // break the tick so each read lands in its own microtask
        return ds.getObject({ objectId } as never);
      })
    );
    await vi.advanceTimersByTimeAsync(1); // flush after all microtasks drain
    await scattered;

    expect(getObjects).toHaveBeenCalledTimes(1);
    expect([...getObjects.mock.calls[0][0].objectIds].sort()).toEqual([
      '0xA',
      '0xB',
      '0xC',
    ]);
  });
});

describe('GrpcDataSource RPC accounting', () => {
  beforeEach(() => resetRpcStats());

  it('records calls under the onchain transport with getObjects cardinality = id count', async () => {
    // intent: attribution must distinguish "one batched request of N" from "N of
    // 1" — so getObjects cardinality is the number of ids the request carried.
    const getObjects = vi.fn(
      async ({ objectIds }: { objectIds: string[] }) => ({
        objects: objectIds.map((objectId) => ({ objectId })),
      })
    );
    const ds = new GrpcDataSource({
      client: { getObjects } as never,
      url: 'x',
      tokensPerSecond: 1000,
    });

    await ds.client.getObjects({ objectIds: ['0xA', '0xB', '0xC'] } as never);

    const stat = getRpcStats().get('onchain:getObjects');
    expect(stat?.calls).toBe(1);
    expect(stat?.cardinality).toBe(3);
  });

  it('scopes a facade call to exactly the requests made inside it', async () => {
    // intent: collectRpcStats answers "which facade call emitted this RPC" —
    // requests outside the scope must not leak into its stats.
    const getObjects = vi.fn(async () => ({ objects: [{ objectId: '0xA' }] }));
    const ds = new GrpcDataSource({
      client: { getObjects } as never,
      url: 'x',
      tokensPerSecond: 1000,
    });

    await ds.client.getObjects({ objectIds: ['0xA'] } as never); // outside scope
    const { stats } = await collectRpcStats(async () => {
      await ds.client.getObjects({ objectIds: ['0xB'] } as never);
      await ds.client.getObjects({ objectIds: ['0xC'] } as never);
    });

    // The scope saw only its two calls; the global map saw all three.
    expect(stats.get('onchain:getObjects')?.calls).toBe(2);
    expect(getRpcStats().get('onchain:getObjects')?.calls).toBe(3);
  });
});
