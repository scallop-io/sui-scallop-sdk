import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getObligationLockedFromOnChain,
  getObligationObjectsFromOnChain,
} from 'src/repositories/obligation/helpers.js';

// parseObjectAs returns the unwrapped `json` for non-dynamic-field objects, so a
// minimal { objectId, type, json } stands in for a real SuiObjectData here.
const obj = (json: unknown, objectId = '0xOB') =>
  ({ objectId, type: '0xpkg::obligation::Obligation', json }) as never;

const makeCtx = (fetchResult: unknown, reject = false) => {
  const fetchWithCache = reject
    ? vi.fn().mockRejectedValue(fetchResult)
    : vi.fn().mockResolvedValue(fetchResult);
  return {
    ctx: {
      onchain: { url: 'mock://node', getObject: vi.fn() },
      fetchWithCache,
    } as never,
    fetchWithCache,
  };
};

beforeEach(() => vi.clearAllMocks());

describe('getObligationLockedFromOnChain', () => {
  it('returns true when the obligation object has a lock_key', async () => {
    // intent: a present lock_key is what gates borrow-incentive flows
    const { ctx } = makeCtx({ object: obj({ lock_key: '0xLOCK' }) });
    expect(await getObligationLockedFromOnChain(ctx, '0xOB')).toBe(true);
  });

  it('returns false (not throw) when lock_key is absent — an unlocked obligation', async () => {
    // intent: unlike the list-assembly parser, the standalone read treats "no key" as unlocked
    const { ctx } = makeCtx({ object: obj({}) });
    expect(await getObligationLockedFromOnChain(ctx, '0xOB')).toBe(false);
  });

  it('propagates a real fetch failure (fail loud)', async () => {
    // intent: a transport error must not be silently coerced to `false`
    const { ctx } = makeCtx(new Error('rpc down'), true);
    await expect(getObligationLockedFromOnChain(ctx, '0xOB')).rejects.toThrow(
      'rpc down'
    );
  });
});

describe('getObligationObjectsFromOnChain', () => {
  const ctxWith = (objects: unknown[]) =>
    ({
      onchain: { url: 'mock://node', client: {} },
      fetchWithCache: vi.fn().mockResolvedValue({ objects }),
    }) as never;

  it('returns [] without fetching when ids is empty', async () => {
    // intent: avoid a pointless RPC round-trip for an empty obligation set
    const fetchWithCache = vi.fn();
    const ctx = { onchain: { url: 'x', client: {} }, fetchWithCache } as never;
    expect(await getObligationObjectsFromOnChain(ctx, [])).toEqual([]);
    expect(fetchWithCache).not.toHaveBeenCalled();
  });

  it('preserves index order and maps per-object errors to null', async () => {
    // intent: callers index by position (obligationObjects[idx] ?? id), so a
    // failed object must hold its slot as null rather than shift the array
    const ok = { objectId: '0xA' };
    const ctx = ctxWith([ok, new Error('missing'), { objectId: '0xC' }]);
    const result = await getObligationObjectsFromOnChain(ctx, [
      '0xA',
      '0xB',
      '0xC',
    ]);
    expect(result).toEqual([ok, null, { objectId: '0xC' }]);
  });
});
