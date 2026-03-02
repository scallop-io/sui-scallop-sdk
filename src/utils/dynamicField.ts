import { normalizeStructTag } from '@scallop-io/sui-kit';
import { bcs } from '@mysten/sui/bcs';
import { EncodeDynamicFieldNameInput } from 'src/types/sui.js';

/**
 * v2 getDynamicObjectField expects name as { type, bcs: Uint8Array }.
 * Converts from v1 style { type, value? } or existing { type, bcs? }.
 */
export function encodeDynamicFieldNameForV2(
  name: EncodeDynamicFieldNameInput
): { type: string; bcs: Uint8Array } {
  const { type, value } = name;

  // Already encoded
  if (name.bcs instanceof Uint8Array) {
    return { type, bcs: name.bcs };
  }

  if (value === undefined) {
    throw new Error(
      `DynamicField name must have 'value' or 'bcs' for type: ${type}`
    );
  }

  let bcsEncoded: Uint8Array;

  // Common types
  if (
    type === '0x2::object::ID' ||
    type === 'address' ||
    type.includes('::typed_id::TypedID')
  ) {
    bcsEncoded = bcs.Address.serialize(value as string).toBytes();
  } else if (
    type === 'u64' ||
    type === 'u8' ||
    type === 'u128' ||
    type === 'u256'
  ) {
    const bcsTypes = {
      u64: bcs.u64(),
      u8: bcs.u8(),
      u128: bcs.u128(),
      u256: bcs.u256(),
    };
    bcsEncoded = bcsTypes[type as keyof typeof bcsTypes]
      .serialize(value)
      .toBytes();
  } else if (type.includes('::type_name::TypeName')) {
    const nameStr =
      typeof value === 'object' && value != null && 'name' in value
        ? (value as { name: string }).name
        : normalizeStructTag(value as string);
    bcsEncoded = bcs
      .struct('TypeName', { name: bcs.string() })
      .serialize({ name: nameStr })
      .toBytes();
  } else {
    // Fallback: treat as string
    bcsEncoded = bcs
      .string()
      .serialize(value as string)
      .toBytes();
  }

  return { type, bcs: bcsEncoded };
}
