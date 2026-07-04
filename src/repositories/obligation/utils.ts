import { SuiClientTypes } from '@mysten/sui/client';
import { parseObjectAs } from 'src/utils/object.js';
import {
  MappedObligationQueryData,
  ObligationQueryInterface,
} from './types.js';
import { mapTypeNameField } from 'src/mappers/moveTypeMapper.js';
import { ScallopParseError } from 'src/errors/index.js';
import { bcs } from '@mysten/sui/bcs';
import { sha3_256 } from '@noble/hashes/sha3.js';

export const getObligationFromObligationKey = (
  obligationKey: SuiClientTypes.Object<{ json: true }>
) => {
  const parsed = parseObjectAs<{ ownership?: { of?: string } }>(obligationKey);
  const obligationId = parsed.ownership?.of;
  if (!obligationId) {
    throw new ScallopParseError(
      `Failed to parse obligation key object ${obligationKey.objectId}`,
      { context: { objectId: obligationKey.objectId } }
    );
  }
  return obligationId;
};

export const getLockKeyFromObligationObject = (
  obligationObject: SuiClientTypes.Object<{ json: true }>
) => {
  const fields = parseObjectAs<{ lock_key?: unknown }>(obligationObject);
  const lockKey = fields.lock_key;
  if (!lockKey) {
    throw new ScallopParseError(
      `Failed to parse obligation object ${obligationObject.objectId} for lock status`,
      { context: { objectId: obligationObject.objectId } }
    );
  }
  return Boolean(lockKey);
};

export const mapObligationEventToObligationData = (
  raw: ObligationQueryInterface | undefined
): MappedObligationQueryData | undefined => {
  if (!raw) return undefined;

  return {
    ...raw,
    collaterals: (raw.collaterals ?? []).map((collateral, index) => ({
      ...collateral,
      type: mapTypeNameField(
        collateral.type,
        `obligation.collaterals[${index}].type`
      ),
    })),
    debts: (raw.debts ?? []).map((debt, index) => ({
      ...debt,
      type: mapTypeNameField(debt.type, `obligation.debts[${index}].type`),
    })),
  };
};

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
