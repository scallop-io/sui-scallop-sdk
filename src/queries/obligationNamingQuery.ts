import { sha3_256 } from '@noble/hashes/sha3.js';
import { bcs } from '@mysten/sui/bcs';
import type { ScallopAddress, ScallopSuiKit } from 'src/models';
import type ScallopQuery from 'src/models/scallopQuery';

/**
 * Compute the naming key used by the obligation_naming contract.
 * key = sha3_256(bcs(obligation_key_id) + bcs(sender))
 */
export const computeNamingKey = (
  obligationKeyId: string,
  owner: string
): string => {
  const keyBytes = bcs.Address.serialize(obligationKeyId).toBytes();
  const ownerBytes = bcs.Address.serialize(owner).toBytes();
  const combined = new Uint8Array(keyBytes.length + ownerBytes.length);
  combined.set(keyBytes, 0);
  combined.set(ownerBytes, keyBytes.length);
  const hashBytes = sha3_256(combined);
  const hash = Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hash}`;
};

/**
 * Get the custom name assigned to an obligation key.
 */
export const getObligationName = async (
  {
    address,
    scallopSuiKit,
  }: {
    address: ScallopAddress;
    scallopSuiKit: ScallopSuiKit;
  },
  obligationKeyId: string,
  owner: string
): Promise<string | null> => {
  const registryId = address.get('obligationNaming.namingRegistry');
  if (!registryId) return null;

  // Get the NamingRegistry object to find the Table ID
  const registryObj = await scallopSuiKit.queryGetObject(registryId);

  if (registryObj?.data?.content?.dataType !== 'moveObject') return null;

  const fields = registryObj.data.content.fields as Record<string, any>;
  const namesTable = fields.names as Record<string, any>;
  const tableId = namesTable?.fields?.id?.id as string | undefined;
  if (!tableId) return null;

  const computedKey = computeNamingKey(obligationKeyId, owner);

  // Query the specific entry
  try {
    const df = await scallopSuiKit.queryGetDynamicFieldObject({
      parentId: tableId,
      name: {
        type: '0x2::object::ID',
        value: computedKey,
      },
    });

    if (df?.data?.content?.dataType === 'moveObject') {
      const nameFields = df.data.content.fields as Record<string, any>;
      const nameValue = nameFields?.value as string | undefined;
      return nameValue ?? null;
    }

    return null;
  } catch (e: unknown) {
    const err = e as Error;
    if (
      err.message?.includes('not found') ||
      err.message?.includes('Cannot find')
    ) {
      return null;
    }
    throw e;
  }
};

/**
 * Get all obligation names for a given owner.
 */
export const getObligationNames = async (
  query: ScallopQuery,
  owner: string
): Promise<Record<string, string>> => {
  const obligations = await query.getObligations(owner);
  const result: Record<string, string> = {};

  await Promise.allSettled(
    obligations.map(async (obligation) => {
      const name = await getObligationName(
        {
          address: query.address,
          scallopSuiKit: query.scallopSuiKit,
        },
        obligation.keyId,
        owner
      );
      if (name) {
        result[obligation.keyId] = name;
      }
    })
  );

  return result;
};
