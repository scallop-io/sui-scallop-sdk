import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getVeScasByAddressBatchedFromOnChain,
  isVeScaKeyInSubsTableFromOnChain,
} from 'src/repositories/veSca/helpers.js';
import { VeScaBcs } from 'src/repositories/veSca/bcs.js';

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
    grpc: { url: 'mock://node', client: {}, getObject: vi.fn() },
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

describe('getVeScasByAddressBatchedFromOnChain', () => {
  const TABLE_ID = `0x${'a'.repeat(64)}`;
  const KEY_ID = `0x${'b'.repeat(64)}`;
  const OWNER = `0x${'c'.repeat(64)}`;
  // The batched path reads `object.content` (BCS of the `Field<UID, Name, Value>`
  // envelope) and slices the value bytes off after the 32-byte UID + 32-byte ID
  // name, then VeScaBcs.parse. Build content = 64 zero bytes + VeSca value bytes.
  const content = (lockedAmount: string, unlockAt: string) => {
    const value = VeScaBcs.serialize({
      locked_amount: lockedAmount,
      unlock_at: unlockAt,
    }).toBytes();
    const bytes = new Uint8Array(64 + value.length);
    bytes.set(value, 64);
    return bytes;
  };

  // version/digest come from the object envelope (the ref the batch must
  // preserve).
  const fieldObject = (objectId: string) => ({
    objectId,
    version: '5',
    digest: 'field-digest',
    // seconds; far future so the lock is still active
    content: content(
      '1000000000',
      String(Math.floor(Date.now() / 1000) + 10_000_000)
    ),
  });

  const makeBatchCtx = () => {
    const fetchWithCache = vi.fn(
      async ({ queryKey }: { queryKey: readonly unknown[] }) => {
        if (queryKey[1] === 'getOwnedObjects') {
          return {
            objects: [
              { objectId: KEY_ID, version: '1', digest: 'k', json: {} },
            ],
            hasNextPage: false,
            cursor: null,
          };
        }
        // getObjects: echo an object back for each requested (derived) id
        const ids = (queryKey[2] as { objectIds: string[] }).objectIds;
        return { objects: ids.map((id) => fieldObject(id)) };
      }
    );
    return {
      grpc: { url: 'mock://node', client: {} },
      fetchWithCache,
      metadata: {
        addresses: {
          veSca: { tableId: TABLE_ID, object: `0x${'d'.repeat(64)}` },
        },
      },
    } as never;
  };

  beforeEach(() => vi.clearAllMocks());

  it('derives field ids, batch-fetches them, and preserves the object ref', async () => {
    // intent: N→1 read still yields the same VeSca shape incl. version/digest
    const ctx = makeBatchCtx();
    const result = await getVeScasByAddressBatchedFromOnChain(ctx, {
      address: OWNER,
      excludeEmpty: false,
    });

    expect(result).toHaveLength(1);
    expect(result[0].keyId).toBe(KEY_ID);
    expect(result[0].lockedScaAmount).toBe('1000000000');
    // the ref the aliased query could NOT provide, hence this batched path:
    expect(result[0].object.version).toBe('5');
    expect(result[0].object.digest).toBe('field-digest');
  });

  it('returns [] when the address owns no veSca keys', async () => {
    const ctx = {
      grpc: { url: 'mock://node', client: {} },
      fetchWithCache: vi
        .fn()
        .mockResolvedValue({ objects: [], hasNextPage: false, cursor: null }),
      metadata: {
        addresses: {
          veSca: { tableId: TABLE_ID, object: `0x${'d'.repeat(64)}` },
        },
      },
    } as never;
    expect(
      await getVeScasByAddressBatchedFromOnChain(ctx, {
        address: OWNER,
        excludeEmpty: false,
      })
    ).toEqual([]);
  });
});
