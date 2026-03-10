import { createHash } from 'node:crypto';
import { bcs } from '@mysten/sui/bcs';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import type { ScallopAddress, ScallopSuiKit } from 'src/models/index.js';
import type ScallopQuery from 'src/models/scallopQuery.js';

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
  const hash = createHash('sha3-256').update(combined).digest('hex');
  return `0x${hash}`;
};

function createJsonRpcClient(scallopSuiKit: ScallopSuiKit): SuiJsonRpcClient {
  return new SuiJsonRpcClient({
    url: scallopSuiKit.suiKit.suiInteractor.currentFullNode,
    network: scallopSuiKit.suiKit.client.network,
  });
}

/**
 * Get the custom name assigned to an obligation key.
 * Uses JSON-RPC (v1 format) to match the on-chain query pattern.
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

  const client = createJsonRpcClient(scallopSuiKit);

  // Get the NamingRegistry object to find the Table ID
  const registryObj = await client.getObject({
    id: registryId,
    options: { showContent: true },
  });

  if (registryObj.data?.content?.dataType !== 'moveObject') return null;

  const fields = (registryObj.data.content as Record<string, any>)
    .fields as Record<string, any>;
  const namesTable = fields.names as Record<string, any>;
  const tableId = namesTable?.fields?.id?.id as string | undefined;
  if (!tableId) return null;

  const computedKey = computeNamingKey(obligationKeyId, owner);

  // Query the specific entry
  try {
    const df = await client.getDynamicFieldObject({
      parentId: tableId,
      name: {
        type: '0x2::object::ID',
        value: computedKey,
      },
    });

    if (df.data?.content?.dataType === 'moveObject') {
      const nameFields = (df.data.content as Record<string, any>)
        .fields as Record<string, any>;
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
