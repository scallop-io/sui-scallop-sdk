import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isVeScaKeyInSubsTableFromOnChain } from './helpers.js';

// The resolved subs-table entry is a dynamic_field::Field object; parseObjectAs
// only unwraps the nested `value` for df-typed objects, so the mock must carry a
// df type and a { id, name, value } json — value being the VecSet { contents }.
const DF_TYPE =
  '0x0000000000000000000000000000000000000000000000000000000000000002::dynamic_field::Field<0x2::object::ID, vec_set::VecSet>';
const obj = (contents: unknown[], objectId = '0xFIELD') =>
  ({
    objectId,
    type: DF_TYPE,
    json: { id: objectId, name: '0xKEY', value: { contents } },
  }) as never;

const makeCtx = (fetchResult: unknown, reject = false) => {
  const fetchWithCache = reject
    ? vi.fn().mockRejectedValue(fetchResult)
    : vi.fn().mockResolvedValue(fetchResult);
  return {
    onchain: { url: 'mock://node', client: {}, getObject: vi.fn() },
    fetchWithCache,
  } as never;
};

const args = { veScaKey: '0xKEY', tableId: '0xTABLE' };

beforeEach(() => vi.clearAllMocks());

describe('isVeScaKeyInSubsTableFromOnChain', () => {
  it('returns true when the entry exists with non-empty contents', async () => {
    // intent: a key with at least one subscription is "in" the table
    const ctx = makeCtx({ object: obj(['0xSUB']) });
    expect(await isVeScaKeyInSubsTableFromOnChain(ctx, args)).toBe(true);
  });

  it('returns false when the entry exists but contents is empty', async () => {
    // intent: an entry with no subscriptions is not considered subscribed
    const ctx = makeCtx({ object: obj([]) });
    expect(await isVeScaKeyInSubsTableFromOnChain(ctx, args)).toBe(false);
  });

  it('returns false when the key has no entry (not found → null)', async () => {
    // intent: absence in the table means not subscribed, not an error
    const ctx = makeCtx(null);
    expect(await isVeScaKeyInSubsTableFromOnChain(ctx, args)).toBe(false);
  });

  it('propagates a real fetch failure (fail loud)', async () => {
    // intent: a transport error must not be silently coerced to `false` here
    const ctx = makeCtx(new Error('rpc down'), true);
    await expect(isVeScaKeyInSubsTableFromOnChain(ctx, args)).rejects.toThrow(
      'rpc down'
    );
  });
});
