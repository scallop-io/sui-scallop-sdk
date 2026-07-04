import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getObligationLockedFromOnChain,
  getObligationNamesFromOnChain,
  getObligationObjectsFromOnChain,
} from 'src/repositories/obligation/helpers.js';
import { bcs } from '@mysten/sui/bcs';

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

describe('getObligationNamesFromOnChain', () => {
  // computeNamingKey runs bcs.Address.serialize, so keys/owner must be valid
  // 32-byte Sui addresses.
  const addr = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;
  const KEY1 = addr(1);
  const KEY2 = addr(2);
  const OWNER = addr(0xabc);

  // dynamicField.value.bcs is decoded bytes; parse a real bcs string from it
  const nameField = (name: string) => ({
    dynamicField: { value: { bcs: bcs.string().serialize(name).toBytes() } },
  });

  // First fetchWithCache call resolves the owned ObligationKey page; each
  // subsequent call resolves (or throws) one key's naming dynamic field.
  const makeNamingCtx = (keyIds: string[], fields: (() => unknown)[]) => {
    const fetchWithCache = vi
      .fn()
      // queryObligationKeys — single page, no next cursor
      .mockResolvedValueOnce({
        objects: keyIds.map((objectId) => ({ objectId })),
        hasNextPage: false,
        cursor: null,
      });
    fields.forEach((f) =>
      fetchWithCache.mockImplementationOnce(async () => f())
    );
    return {
      onchain: { url: 'mock://node', client: {} },
      fetchWithCache,
      metadata: {
        addresses: {
          protocolObjectId: '0xpkg',
          obligationNaming: { registryTableId: '0xREG' },
        },
      },
    } as never;
  };

  it('maps each obligation id to its decoded name', async () => {
    // intent: happy path — every key has a naming dynamic field
    const ctx = makeNamingCtx(
      [KEY1, KEY2],
      [() => nameField('alpha'), () => nameField('beta')]
    );
    expect(await getObligationNamesFromOnChain(ctx, OWNER)).toEqual({
      [KEY1]: 'alpha',
      [KEY2]: 'beta',
    });
  });

  it('skips a key whose dynamic-field fetch rejects instead of failing the batch', async () => {
    // intent: a nameless obligation has no dynamic field (getDynamicField
    // throws) — it must be dropped, not abort every other name
    const ctx = makeNamingCtx(
      [KEY1, KEY2],
      [
        () => nameField('alpha'),
        () => {
          throw new Error('dynamic field not found');
        },
      ]
    );
    expect(await getObligationNamesFromOnChain(ctx, OWNER)).toEqual({
      [KEY1]: 'alpha',
    });
  });

  it('returns {} (not throw) when every key fetch rejects', async () => {
    // intent: an owner with no named obligations yields an empty map
    const ctx = makeNamingCtx(
      [KEY1, KEY2],
      [
        () => {
          throw new Error('missing');
        },
        () => {
          throw new Error('missing');
        },
      ]
    );
    expect(await getObligationNamesFromOnChain(ctx, OWNER)).toEqual({});
  });
});
