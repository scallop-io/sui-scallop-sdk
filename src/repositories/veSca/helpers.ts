import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import {
  VeSca,
  VeScaDataContext,
  VeScasByAddressContext,
  VeScaTreasuryContext,
  VeScaTreasuryFields,
} from './types.js';
import { VeScaBcs } from './bcs.js';
import { SuiClientTypes } from '@mysten/sui/client';
import { queryKeys } from 'src/constants/queryKeys.js';
import { MAX_LOCK_DURATION } from 'src/constants/vesca.js';
import { getSharedObjectData, parseObjectAs } from 'src/utils/object.js';
import {
  logError,
  isObjectNotFoundError,
  type OnChainReadContext,
} from '../utils.js';
import { ScallopRpcError } from 'src/errors/index.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { bcs } from '@mysten/sui/bcs';
import { deriveDynamicFieldID } from '@mysten/sui/utils';
import { partitionArray } from 'src/utils/array.js';
import { BigNumber } from 'bignumber.js';

const queryVeScaKeysByAddress = async (
  ctx: VeScasByAddressContext,
  address: string
) => {
  const {
    onchain,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;

  const keyType = `${addresses.veSca.object}::ve_sca::VeScaKey`;

  const objects: SuiClientTypes.Object<{ json: true }>[] = [];
  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;
  do {
    const options: SuiClientTypes.ListOwnedObjectsOptions<{ json: true }> = {
      owner: address,
      type: keyType,
      include: {
        json: true,
      },
      cursor: nextCursor,
      limit: 50,
    };
    const response = await fetchWithCache({
      queryKey: queryKeys.rpc.getOwnedObjects({
        ...options,
        node: onchain.url,
      }),
      queryFn: () => onchain.client.listOwnedObjects<{ json: true }>(options),
    });

    objects.push(...response.objects);

    if (response.hasNextPage && response.cursor) {
      hasNextPage = true;
      nextCursor = response.cursor;
    } else {
      hasNextPage = false;
    }
  } while (hasNextPage);

  return objects;
};

const queryTreasuryTotalVeSca = async (ctx: VeScaTreasuryContext) => {
  const {
    onchain,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;
  const { id, config, treasury } = addresses.veSca;

  const tx = new SuiTxBlock();

  const getArg = async (objectId: string, mutable: boolean) => {
    const response = await fetchWithCache({
      queryKey: queryKeys.rpc.getObject({
        node: onchain.url,
        objectId,
      }),
      queryFn: () => onchain.getObject({ objectId }),
    });
    if (!response.object) {
      throw logError(
        ctx.logger,
        new ScallopRpcError(`Failed to fetch object ${objectId}`, {
          context: { objectId },
        })
      );
    }
    return getSharedObjectData(
      { onchain, fetchWithCache },
      {
        tx,
        mutable,
        objectId: response.object,
      }
    );
  };

  const [treasurySharedObject, configSharedObject] = await Promise.all([
    getArg(treasury, true),
    getArg(config, false),
  ]);

  // Refreh query
  const refreshQueryTarget = `${id}::treasury::refresh`;
  const refreshArgs = [
    configSharedObject,
    treasurySharedObject,
    tx.txBlock.object.clock(),
  ];

  // query total veSca amount
  const veScaAmountQueryTarget = `${id}::treasury::total_ve_sca_amount`;
  const veScaAmountArgs = [treasurySharedObject, tx.txBlock.object.clock()];

  tx.moveCall(refreshQueryTarget, refreshArgs);
  tx.moveCall(veScaAmountQueryTarget, veScaAmountArgs);

  const queryResults = await fetchWithCache({
    queryKey: queryKeys.rpc.getTotalVeScaTreasuryAmount({
      refreshArgs,
      veScaAmountArgs,
      node: onchain.url,
    }),
    queryFn: () =>
      onchain.client.simulateTransaction<{ commandResults: true }>({
        transaction: tx.txBlock,
        include: {
          commandResults: true,
        },
      }),
  });

  const commandResults = queryResults?.commandResults;
  if (!commandResults) {
    throw logError(
      ctx.logger,
      new ScallopRpcError(
        'Failed to fetch total veSca amount from treasury: No command results',
        { context: { treasury } }
      )
    );
  }

  const resultBcs = commandResults[1]?.returnValues?.[0].bcs;
  if (!resultBcs) {
    throw logError(
      ctx.logger,
      new ScallopRpcError('Failed to fetch result bcs from vesca treasury', {
        context: { treasury },
      })
    );
  }

  return bcs.u64().parse(resultBcs);
};

/**
 * Pure veSca math shared by the per-key and batched reads: turn a raw
 * `{ locked_amount, unlock_at }` value + the field object's ref into a `VeSca`.
 * Kept side-effect-free so both read paths produce identical results.
 */
const computeVeSca = (params: {
  keyId: string;
  fieldId: string;
  ref: { version: string; digest: string };
  lockedAmount: string | number;
  unlockAt: string | number;
}): VeSca => {
  const { keyId, fieldId, ref, lockedAmount, unlockAt } = params;
  const remainingLockPeriodInMilliseconds = Math.max(
    +unlockAt * 1000 - Date.now(),
    0
  );
  const lockedScaAmount = String(lockedAmount);
  const lockedScaCoin = BigNumber(lockedAmount).shiftedBy(-9).toNumber();
  const currentVeScaBalance =
    lockedScaCoin *
    (Math.floor(remainingLockPeriodInMilliseconds / 1000) / MAX_LOCK_DURATION);

  return {
    id: fieldId,
    keyId,
    object: { objectId: fieldId, version: ref.version, digest: ref.digest },
    lockedScaAmount,
    lockedScaCoin,
    currentVeScaBalance,
    unlockAt: BigNumber(Number(unlockAt) * 1000).toNumber(),
  } as VeSca;
};

export const getVeScaDataFromOnChain = async (
  ctx: VeScaDataContext,
  veScaKey: string
) => {
  const {
    onchain,
    metadata: { addresses },
    fetchWithCache,
  } = ctx;

  const fetchOptions = {
    parentId: addresses.veSca.tableId,
    name: encodeDynamicFieldNameForV2({
      type: '0x2::object::ID',
      value: veScaKey,
    }),
  };
  const { dynamicField } = await fetchWithCache({
    queryKey: queryKeys.rpc.getDynamicFieldObject({
      ...fetchOptions,
      node: onchain.url,
    }),
    queryFn: () => onchain.client.getDynamicField(fetchOptions),
  });

  // veSca key not bound to a veSca object → no data (matches the old query's
  // graceful `undefined` rather than throwing on a missing dynamic field).
  if (!dynamicField?.value?.bcs) return undefined;

  // Parse bcs value
  const parsed = VeScaBcs.parse(dynamicField.value.bcs);

  return computeVeSca({
    keyId: veScaKey,
    fieldId: dynamicField.fieldId,
    ref: { version: dynamicField.version, digest: dynamicField.digest },
    lockedAmount: parsed.locked_amount,
    unlockAt: parsed.unlock_at,
  });
};

export const getVeScasByAddressFromOnChain = async (
  ctx: VeScasByAddressContext,
  {
    address,
    excludeEmpty,
  }: {
    address: string;
    excludeEmpty: boolean;
  }
) => {
  const veScaKeys = await queryVeScaKeysByAddress(ctx, address);

  const veScas = (
    await Promise.all(
      veScaKeys.map((veScaKey) =>
        getVeScaDataFromOnChain(ctx, veScaKey.objectId)
      )
    )
  ).filter((v): v is VeSca => !!v);

  // Sort by voting power (veSca balance), matching the legacy getVeScas — the
  // first entry is treated as the user's "primary" veSca elsewhere.
  veScas.sort((a, b) => b.currentVeScaBalance - a.currentVeScaBalance);

  if (excludeEmpty) {
    return veScas.filter((v) => v.lockedScaAmount !== '0');
  }

  return veScas;
};

/**
 * Batched twin of {@link getVeScasByAddressFromOnChain}. Instead of one
 * `getDynamicField` per owned key (N round trips against the global veSca
 * table), it derives each field id offline (`deriveDynamicFieldID`) and fetches
 * them all in one chunked `getObjects` — N→1 while preserving each field
 * object's `version`/`digest` (needed as a tx-building ref). Transport-agnostic
 * (rides `onchain.getObjects`), so it also benefits gRPC when opted in.
 */
export const getVeScasByAddressBatchedFromOnChain = async (
  ctx: VeScasByAddressContext,
  {
    address,
    excludeEmpty,
  }: {
    address: string;
    excludeEmpty: boolean;
  }
): Promise<VeSca[]> => {
  const {
    onchain,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;
  const tableId = addresses.veSca.tableId;

  const veScaKeys = await queryVeScaKeysByAddress(ctx, address);
  if (veScaKeys.length === 0) return [];

  // Derive the dynamic-field object id for each owned key (same derivation the
  // transport's getDynamicField uses), so we can batch-fetch them directly.
  // `nameBcs` is the BCS of the `0x2::object::ID` key (a 32-byte address).
  const fields = veScaKeys.map((key) => {
    const nameBcs = encodeDynamicFieldNameForV2({
      type: '0x2::object::ID',
      value: key.objectId,
    }).bcs;
    return {
      keyId: key.objectId,
      nameByteLength: nameBcs.length,
      fieldId: deriveDynamicFieldID(
        tableId,
        '0x2::object::ID',
        nameBcs
      ) as string,
    };
  });

  const objectById: Record<
    string,
    SuiClientTypes.Object<{ content: true }>
  > = {};
  for (const chunk of partitionArray(
    fields.map((f) => f.fieldId),
    50
  )) {
    const { objects } = await fetchWithCache({
      queryKey: queryKeys.rpc.getObjects({
        objectIds: chunk,
        node: onchain.url,
      }),
      queryFn: () =>
        onchain.client.getObjects<{ content: true }>({
          objectIds: chunk,
          include: { content: true },
        }),
    });
    for (const object of objects) {
      if (!(object instanceof Error)) objectById[object.objectId] = object;
    }
  }

  const veScas = fields
    .map(({ keyId, fieldId, nameByteLength }) => {
      const object = objectById[fieldId];
      const content = object?.content;
      if (!content) return undefined; // key not bound → no data
      // The field object is a `Field<UID, Name, Value>`; the stored value bytes
      // follow the 32-byte UID and the name. Slicing + VeScaBcs.parse mirrors the
      // transport's own getDynamicField (byte-identical to the per-key path),
      // avoiding any JSON-shape drift.
      const parsed = VeScaBcs.parse(content.slice(32 + nameByteLength));
      return computeVeSca({
        keyId,
        fieldId,
        ref: { version: object.version, digest: object.digest },
        lockedAmount: parsed.locked_amount,
        unlockAt: parsed.unlock_at,
      });
    })
    .filter((v): v is VeSca => !!v);

  veScas.sort((a, b) => b.currentVeScaBalance - a.currentVeScaBalance);

  return excludeEmpty
    ? veScas.filter((v) => v.lockedScaAmount !== '0')
    : veScas;
};

/**
 * Whether `veScaKey` is present (and non-empty) in the given subscription table.
 * Ports the legacy `vescaBuilder.isInSubsTable` read: resolve the dynamic field
 * for the key, fetch its object json, and check the VecSet `contents` is
 * non-empty. Returns `false` when the key has no entry (not-found → not
 * subscribed); real RPC/transport failures propagate.
 */
export const isVeScaKeyInSubsTableFromOnChain = async (
  ctx: OnChainReadContext,
  { veScaKey, tableId }: { veScaKey: string; tableId: string }
): Promise<boolean> => {
  const { onchain, fetchWithCache } = ctx;
  const name = {
    type: '0x2::object::ID',
    value: veScaKey,
  };

  const object = await fetchWithCache({
    queryKey: queryKeys.rpc.getDynamicFieldObject({
      parentId: tableId,
      name,
      node: onchain.url,
    }),
    queryFn: async () => {
      try {
        const { dynamicField } = await onchain.client.getDynamicField({
          parentId: tableId,
          name: encodeDynamicFieldNameForV2(name),
        });
        return await onchain.getObject({
          objectId: dynamicField.fieldId,
          include: { json: true },
        });
      } catch (cause) {
        if (isObjectNotFoundError(cause)) return null;
        throw cause;
      }
    },
  });

  if (!object?.object) return false;
  const value = parseObjectAs<{ contents?: unknown[] }>(object.object);
  return Array.isArray(value?.contents) && value.contents.length > 0;
};

export const getVeScaTreasuryInfoFromOnChain = async (
  ctx: VeScaTreasuryContext
) => {
  const {
    onchain,
    metadata: { addresses },
    fetchWithCache,
  } = ctx;

  const fetchOptions: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: addresses.veSca.treasury,
    include: {
      json: true,
    },
  };
  const treasuryObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({
      ...fetchOptions,
      node: onchain.url,
    }),
    queryFn: () => onchain.getObject(fetchOptions),
  });

  const fields = parseObjectAs<VeScaTreasuryFields>(treasuryObject.object);
  const totalLockedSca = BigNumber(fields.unlock_schedule.locked_sca_amount)
    .shiftedBy(-9)
    .toNumber();
  const totalVeSca = BigNumber(await queryTreasuryTotalVeSca(ctx))
    .shiftedBy(-9)
    .toNumber();

  const averageLockingPeriod =
    totalLockedSca > 0 ? (totalVeSca / totalLockedSca) * 4 : 0; // in years
  const averageLockingPeriodUnit = 'year';
  return {
    totalLockedSca,
    totalVeSca,
    averageLockingPeriod,
    averageLockingPeriodUnit,
  };
};
