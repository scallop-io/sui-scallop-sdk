import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bcs } from '@mysten/sui/bcs';
import { normalizeStructTag } from '@scallop-io/sui-kit';
import type { SuiObjectData } from 'src/types/index.js';
import { parseUrl } from 'src/utils/url.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import {
  asSharedObject,
  getDfObjectIdAndName,
  getSharedObjectData,
  parseObjectAs,
} from 'src/utils/object.js';
import {
  callMethodWithIndexerFallback,
  withIndexerFallback,
} from 'src/utils/indexer.js';
import { findClosestUnlockRound, partitionArray } from 'src/utils/vesca.js';
import { MAX_LOCK_DURATION } from 'src/constants/index.js';

const DYNAMIC_FIELD_TYPE_PREFIX =
  '0x0000000000000000000000000000000000000000000000000000000000000002::dynamic_field::Field';

const createSuiObject = (
  overrides: Partial<{
    objectId: string;
    type: string;
    owner: unknown;
    json: unknown;
  }> = {}
): SuiObjectData => {
  return {
    objectId: '0xobject',
    type: '0x1::sample::Object',
    owner: { $kind: 'AddressOwner', AddressOwner: '0x1' },
    json: { fields: {} },
    ...overrides,
  } as unknown as SuiObjectData;
};

const createTxMock = () => {
  const sharedObjectRef = vi.fn((input: unknown) => ({
    tag: 'shared',
    input,
  }));
  const object = vi.fn((objectId: string) => ({ tag: 'object', objectId }));
  return {
    tx: { sharedObjectRef, object },
    sharedObjectRef,
    object,
  };
};

describe('utils/url', () => {
  it('trims a trailing slash', () => {
    expect(parseUrl('https://api.example.com/')).toBe(
      'https://api.example.com'
    );
  });

  it('keeps url unchanged without trailing slash', () => {
    expect(parseUrl('https://api.example.com')).toBe('https://api.example.com');
  });
});

describe('utils/dynamicField', () => {
  it('returns pre-encoded dynamic field name as-is', () => {
    const preEncoded = new Uint8Array([1, 2, 3]);
    const result = encodeDynamicFieldNameForV2({
      type: 'u64',
      bcs: preEncoded,
    });

    expect(result).toEqual({
      type: 'u64',
      bcs: preEncoded,
    });
  });

  it('throws when value and bcs are both missing', () => {
    expect(() => encodeDynamicFieldNameForV2({ type: 'u64' } as never)).toThrow(
      "DynamicField name must have 'value' or 'bcs' for type: u64"
    );
  });

  it('encodes address-like values via bcs.Address', () => {
    const address =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    const result = encodeDynamicFieldNameForV2({
      type: 'address',
      value: address,
    });

    expect(result.bcs).toEqual(bcs.Address.serialize(address).toBytes());
  });

  it('encodes integer values via corresponding bcs type', () => {
    const result = encodeDynamicFieldNameForV2({
      type: 'u128',
      value: 123n,
    });

    expect(result.bcs).toEqual(bcs.u128().serialize(123n).toBytes());
  });

  it('encodes TypeName value object without normalization', () => {
    const result = encodeDynamicFieldNameForV2({
      type: '0x1::type_name::TypeName',
      value: { name: '0xabc::coin::COIN' },
    });

    const expected = bcs
      .struct('TypeName', { name: bcs.string() })
      .serialize({ name: '0xabc::coin::COIN' })
      .toBytes();

    expect(result.bcs).toEqual(expected);
  });

  it('normalizes TypeName string values before encoding', () => {
    const value =
      '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
    const result = encodeDynamicFieldNameForV2({
      type: '0x2::type_name::TypeName',
      value,
    });

    const expected = bcs
      .struct('TypeName', { name: bcs.string() })
      .serialize({ name: normalizeStructTag(value) })
      .toBytes();

    expect(result.bcs).toEqual(expected);
  });

  it('falls back to bcs.string for unknown types', () => {
    const result = encodeDynamicFieldNameForV2({
      type: '0x1::custom::Key',
      value: 'hello',
    });

    expect(result.bcs).toEqual(bcs.string().serialize('hello').toBytes());
  });
});

describe('utils/object', () => {
  it('converts shared object metadata to sharedObjectRef', () => {
    const { tx, sharedObjectRef } = createTxMock();

    const result = asSharedObject(tx as never, {
      obj: {
        objectId: '0xshared',
        initialSharedVersion: '99',
      },
      mutable: true,
    });

    expect(sharedObjectRef).toHaveBeenCalledWith({
      objectId: '0xshared',
      initialSharedVersion: '99',
      mutable: true,
    });
    expect(result).toEqual({
      tag: 'shared',
      input: {
        objectId: '0xshared',
        initialSharedVersion: '99',
        mutable: true,
      },
    });
  });

  it('converts object reference and string ids via tx.object', () => {
    const { tx, object } = createTxMock();
    const objectRef = {
      objectId: '0xref',
      version: '1',
      digest: 'digest',
    };

    const refResult = asSharedObject(tx as never, { obj: objectRef as never });
    const strResult = asSharedObject(tx as never, { obj: '0xstring' });

    expect(object).toHaveBeenNthCalledWith(1, '0xref');
    expect(object).toHaveBeenNthCalledWith(2, '0xstring');
    expect(refResult).toEqual({ tag: 'object', objectId: '0xref' });
    expect(strResult).toEqual({ tag: 'object', objectId: '0xstring' });
  });

  it('returns input object when it is not convertible', () => {
    const { tx } = createTxMock();
    const suiObjectArg = { $kind: 'Result', Result: 0 };

    const result = asSharedObject(tx as never, {
      obj: suiObjectArg as never,
    });

    expect(result).toEqual(suiObjectArg);
  });

  it('fetches shared object data for string input and maps as shared', async () => {
    const { tx, sharedObjectRef } = createTxMock();
    const objectData = createSuiObject({
      objectId: '0xshared',
      owner: {
        $kind: 'Shared',
        Shared: { initialSharedVersion: 7 },
      },
    });
    const queryGetObject = vi.fn().mockResolvedValue({ object: objectData });
    const scallopSuiKit = { queryGetObject };

    const result = await getSharedObjectData(scallopSuiKit as never, {
      tx: tx as never,
      object: '0xshared',
      mutable: true,
    });

    expect(queryGetObject).toHaveBeenCalledWith('0xshared', {
      json: true,
      content: false,
    });
    expect(sharedObjectRef).toHaveBeenCalledWith({
      objectId: '0xshared',
      initialSharedVersion: '7',
      mutable: true,
    });
    expect(result).toEqual({
      tag: 'shared',
      input: {
        objectId: '0xshared',
        initialSharedVersion: '7',
        mutable: true,
      },
    });
  });

  it('throws when queryGetObject returns no object data', async () => {
    const { tx } = createTxMock();
    const scallopSuiKit = {
      queryGetObject: vi.fn().mockResolvedValue({ object: null }),
    };

    await expect(
      getSharedObjectData(scallopSuiKit as never, {
        tx: tx as never,
        object: '0xmissing',
      })
    ).rejects.toThrow('Failed to get object data');
  });

  it('uses provided object data without fetching', async () => {
    const { tx, object } = createTxMock();
    const queryGetObject = vi.fn();
    const scallopSuiKit = { queryGetObject };
    const nonSharedObject = createSuiObject({
      objectId: '0xnonshared',
      owner: { $kind: 'AddressOwner', AddressOwner: '0x1' },
    });

    const result = await getSharedObjectData(scallopSuiKit as never, {
      tx: tx as never,
      object: nonSharedObject,
    });

    expect(queryGetObject).not.toHaveBeenCalled();
    expect(object).toHaveBeenCalledWith('0xnonshared');
    expect(result).toEqual({ tag: 'object', objectId: '0xnonshared' });
  });

  it('returns object fields for non-dynamic field objects', () => {
    const object = createSuiObject({
      json: { fields: { value: 123 } },
      type: '0x1::sample::Object',
    });

    const result = parseObjectAs<{ value: number }>(object);

    expect(result).toEqual({ value: 123 });
  });

  it('returns raw json when fields property is absent', () => {
    const object = createSuiObject({
      json: { value: 456 },
    });

    const result = parseObjectAs<{ value: number }>(object);

    expect(result).toEqual({ value: 456 });
  });

  it('unwraps nested dynamic field values', () => {
    const object = createSuiObject({
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<address, address>`,
      json: {
        fields: {
          id: '0xouter',
          name: 'outer',
          value: {
            id: '0xmiddle',
            name: 'middle',
            value: {
              id: '0xinner',
              name: 'inner',
              value: { token: 'SCA' },
            },
          },
        },
      },
    });

    const result = parseObjectAs<{ token: string }>(object);
    expect(result).toEqual({
      id: '0xmiddle',
      name: 'middle',
      value: { id: '0xinner', name: 'inner', value: { token: 'SCA' } },
    });
  });

  it('throws for missing object json', () => {
    const object = createSuiObject({ json: undefined });
    expect(() => parseObjectAs(object)).toThrow('Failed to parse object');
  });

  it('throws for invalid dynamic field object payload', () => {
    const object = createSuiObject({
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<address, address>`,
      json: {
        fields: {
          invalid: true,
        },
      },
    });
    expect(() => parseObjectAs(object)).toThrow('Invalid dynamic field data');
  });

  it('extracts object id and name from dynamic field object', () => {
    const object = createSuiObject({
      objectId: '0xdf',
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<address, address>`,
      json: {
        fields: {
          id: '0xinner',
          name: { id: '0xname' },
          value: 1,
        },
      },
    });

    const result = getDfObjectIdAndName(object);

    expect(result).toEqual({
      objectId: '0xinner',
      name: '0xname',
      nameKind: 'id',
    });
  });

  it('throws for non-dynamic-field objects in getDfObjectIdAndName', () => {
    const object = createSuiObject({
      objectId: '0xnotdf',
      type: '0x1::sample::Object',
    });
    expect(() => getDfObjectIdAndName(object)).toThrow(
      'Object 0xnotdf is not a dynamic field object'
    );
  });

  it('throws when dynamic field name cannot be parsed', () => {
    const object = createSuiObject({
      objectId: '0xdf',
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<address, address>`,
      json: {
        fields: {
          id: '0xinner',
          name: { value: 'not-supported' },
          value: 1,
        },
      },
    });

    expect(() => getDfObjectIdAndName(object)).toThrow(
      'Failed to parse dynamic field name from object 0xdf'
    );
  });

  // --- unwrapMoveJson / JSON-RPC format handling ---

  it('unwraps JSON-RPC {type, fields} structs in parseObjectAs', () => {
    // Simulates JSON-RPC response with nested Move structs
    const object = createSuiObject({
      type: '0x1::market::Market',
      json: {
        fields: {
          vault: {
            type: '0x1::vault::Vault',
            fields: {
              balance_sheets: {
                type: '0x2::table::Table',
                fields: {
                  id: { id: '0xbalance' },
                  size: '5',
                },
              },
            },
          },
          risk_models: {
            type: '0x2::table::Table',
            fields: {
              id: { id: '0xrisk' },
              size: '3',
            },
          },
        },
      },
    });

    const result = parseObjectAs<{
      vault: { balance_sheets: { id: { id: string }; size: string } };
      risk_models: { id: { id: string }; size: string };
    }>(object);

    // {type, fields} wrappers should be stripped
    expect(result.vault.balance_sheets.id.id).toBe('0xbalance');
    expect(result.risk_models.id.id).toBe('0xrisk');
    expect(result.vault.balance_sheets.size).toBe('5');
  });

  it('leaves gRPC flat format unchanged in parseObjectAs', () => {
    // gRPC responses have no {type, fields} wrappers
    const object = createSuiObject({
      type: '0x1::market::Market',
      json: {
        vault: {
          balance_sheets: {
            id: { id: '0xbalance' },
            size: '5',
          },
        },
        risk_models: {
          id: { id: '0xrisk' },
          size: '3',
        },
      },
    });

    const result = parseObjectAs<{
      vault: { balance_sheets: { id: { id: string }; size: string } };
      risk_models: { id: { id: string }; size: string };
    }>(object);

    expect(result.vault.balance_sheets.id.id).toBe('0xbalance');
    expect(result.risk_models.id.id).toBe('0xrisk');
  });

  it('unwraps arrays containing {type, fields} elements', () => {
    const object = createSuiObject({
      type: '0x1::spool::StakePool',
      json: {
        fields: {
          items: [
            { type: '0x1::item::Item', fields: { name: 'a', value: 1 } },
            { type: '0x1::item::Item', fields: { name: 'b', value: 2 } },
          ],
        },
      },
    });

    const result = parseObjectAs<{
      items: { name: string; value: number }[];
    }>(object);

    expect(result.items).toEqual([
      { name: 'a', value: 1 },
      { name: 'b', value: 2 },
    ]);
  });

  it('parseObjectAs returns string value for DF string fields (borrowLimit pattern)', () => {
    // Simulates getDynamicField response for borrow limit / supply limit
    const object = createSuiObject({
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<0x1::key::BorrowLimitKey, u64>`,
      json: {
        fields: {
          id: '0xdf1',
          name: { name: '0xabc' },
          value: '1000000',
        },
      },
    });

    const result = parseObjectAs<string>(object);
    expect(result).toBe('1000000');
  });

  it('parseObjectAs returns boolean value for DF boolean fields (isolatedAsset pattern)', () => {
    const object = createSuiObject({
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<0x1::key::IsolatedAssetKey, bool>`,
      json: {
        fields: {
          id: '0xdf2',
          name: { name: '0xdef' },
          value: true,
        },
      },
    });

    const result = parseObjectAs<boolean>(object);
    expect(result).toBe(true);
  });

  it('parseObjectAs unwraps JSON-RPC format inside DF value (spool pattern)', () => {
    // DF whose value is a Move struct in JSON-RPC format
    const object = createSuiObject({
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<address, 0x1::spool::StakeAccount>`,
      json: {
        fields: {
          id: '0xdf3',
          name: '0xaddr',
          value: {
            type: '0x1::spool::StakeAccount',
            fields: {
              spool_id: '0xpool1',
              stake_type: {
                type: '0x1::type_name::TypeName',
                fields: 'sweth',
              },
              stakes: '500',
              index: '10',
              points: '200',
              total_points: '1000',
            },
          },
        },
      },
    });

    const result = parseObjectAs<{
      spool_id: string;
      stake_type: string;
      stakes: string;
      index: string;
      points: string;
      total_points: string;
    }>(object);

    expect(result.spool_id).toBe('0xpool1');
    expect(result.stake_type).toBe('sweth');
    expect(result.stakes).toBe('500');
  });

  it('getDfObjectIdAndName extracts id from nested {id: string} format', () => {
    const object = createSuiObject({
      objectId: '0xdf4',
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<0x1::type_name::TypeName, u64>`,
      json: {
        fields: {
          id: { id: '0xactual_id' },
          name: { name: '0xcointype' },
          value: '999',
        },
      },
    });

    const result = getDfObjectIdAndName(object);
    expect(result.objectId).toBe('0xactual_id');
    expect(result.name).toBe('0xcointype');
  });

  it('getDfObjectIdAndName works with JSON-RPC wrapped name', () => {
    const object = createSuiObject({
      objectId: '0xdf5',
      type: `${DYNAMIC_FIELD_TYPE_PREFIX}<0x1::type_name::TypeName, u64>`,
      json: {
        fields: {
          id: '0xsimple_id',
          name: {
            type: '0x1::type_name::TypeName',
            fields: { name: '0xwrapped_coin' },
          },
          value: '123',
        },
      },
    });

    const result = getDfObjectIdAndName(object);
    expect(result.objectId).toBe('0xsimple_id');
    expect(result.name).toBe('0xwrapped_coin');
  });

  it('parseObjectAs handles deeply nested JSON-RPC structs (poolAddresses pattern)', () => {
    const object = createSuiObject({
      type: '0x1::market::Market',
      json: {
        fields: {
          vault: {
            type: '0x1::vault::Vault',
            fields: {
              balance_sheets: {
                type: '0x2::table::Table',
                fields: {
                  table: {
                    type: '0x2::table::TableInner',
                    fields: {
                      id: { id: '0xbs_table' },
                    },
                  },
                },
              },
            },
          },
          collateral_stats: {
            type: '0x2::table::Table',
            fields: {
              table: {
                type: '0x2::table::TableInner',
                fields: {
                  id: { id: '0xcs_table' },
                },
              },
            },
          },
        },
      },
    });

    const result = parseObjectAs<{
      vault: {
        balance_sheets: { table: { id: { id: string } } };
      };
      collateral_stats: { table: { id: { id: string } } };
    }>(object);

    expect(result.vault.balance_sheets.table.id.id).toBe('0xbs_table');
    expect(result.collateral_stats.table.id.id).toBe('0xcs_table');
  });
});

describe('utils/indexer', () => {
  it('retries once with indexer=false when first call fails', async () => {
    const context = { tag: 'ctx' };
    const seenContexts: unknown[] = [];
    const method = vi.fn(async function (
      this: { tag: string },
      input: string,
      options: { indexer: boolean; limit: number }
    ) {
      seenContexts.push(this);
      if (options.indexer) {
        throw new Error('boom');
      }
      return `${this.tag}:${input}:${options.indexer}:${options.limit}`;
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await callMethodWithIndexerFallback(
      method,
      context,
      'pool',
      { indexer: true, limit: 50 }
    );

    expect(result).toBe('ctx:pool:false:10');
    expect(method).toHaveBeenCalledTimes(2);
    expect(method.mock.calls[0]).toEqual([
      'pool',
      { indexer: true, limit: 50 },
    ]);
    expect(method.mock.calls[1]).toEqual([
      'pool',
      { indexer: false, limit: 50 },
    ]);
    expect(seenContexts).toEqual([context, context]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('does not fallback when indexer flag is not present', async () => {
    const method = vi.fn(async (value: string) => value.toUpperCase());

    const result = await callMethodWithIndexerFallback(method, {}, 'sui');

    expect(result).toBe('SUI');
    expect(method).toHaveBeenCalledTimes(1);
  });

  it('wraps methods while preserving this context', async () => {
    const context = { base: 40 };
    const seenContexts: unknown[] = [];
    const method = vi.fn(async function (
      this: { base: number },
      n: number,
      options: { indexer: boolean }
    ) {
      seenContexts.push(this);
      if (options.indexer) throw new Error('retry');
      return this.base + n;
    });
    const wrapped = withIndexerFallback.call(context, method) as (
      n: number,
      options: { indexer: boolean }
    ) => Promise<number>;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await wrapped(2, { indexer: true });

    expect(result).toBe(42);
    expect(method).toHaveBeenCalledTimes(2);
    expect(seenContexts).toEqual([context, context]);
    warnSpy.mockRestore();
  });
});

describe('utils/vesca', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('finds the next UTC midnight unlock round', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const unlockAt = Math.floor(
      new Date('2026-01-01T12:34:56.000Z').getTime() / 1000
    );

    const result = findClosestUnlockRound(unlockAt);

    expect(result).toBe(
      Math.floor(new Date('2026-01-02T00:00:00.000Z').getTime() / 1000)
    );
  });

  it('caps unlock round at max lock duration from now', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    vi.setSystemTime(now);
    const unlockAt = Math.floor(now.getTime() / 1000) + MAX_LOCK_DURATION;

    const result = findClosestUnlockRound(unlockAt);

    expect(result).toBe(unlockAt);
  });

  it('partitions arrays into fixed-size chunks', () => {
    expect(partitionArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(partitionArray([], 3)).toEqual([]);
  });
});
