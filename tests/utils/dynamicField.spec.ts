import { describe, expect, it } from 'vitest';
import { bcs } from '@mysten/sui/bcs';
import { normalizeStructTag } from '@scallop-io/sui-kit';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';

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
