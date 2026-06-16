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
import { logError, isObjectNotFoundError } from '../utils.js';
import { ScallopRpcError } from 'src/errors/index.js';
import { BaseContext } from '../types.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { bcs } from '@mysten/sui/bcs';
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
      queryKey: queryKeys.rpc.getSharedObject({
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
    return getSharedObjectData(onchain, {
      tx,
      mutable,
      objectId: response.object,
    });
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
  const valueBcs = dynamicField.value.bcs;
  const parsed = VeScaBcs.parse(valueBcs);

  const remainingLockPeriodInMilliseconds = Math.max(
    +parsed.unlock_at * 1000 - Date.now(),
    0
  );
  const lockedScaAmount = String(parsed.locked_amount);
  const lockedScaCoin = BigNumber(parsed.locked_amount)
    .shiftedBy(-9)
    .toNumber();
  const currentVeScaBalance =
    lockedScaCoin *
    (Math.floor(remainingLockPeriodInMilliseconds / 1000) / MAX_LOCK_DURATION);

  return {
    id: dynamicField.fieldId,
    keyId: veScaKey,
    object: {
      objectId: dynamicField.fieldId,
      version: dynamicField.version,
      digest: dynamicField.digest,
    },
    lockedScaAmount,
    lockedScaCoin,
    currentVeScaBalance,
    unlockAt: BigNumber(Number(parsed.unlock_at) * 1000).toNumber(),
  } as VeSca;
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
 * Whether `veScaKey` is present (and non-empty) in the given subscription table.
 * Ports the legacy `vescaBuilder.isInSubsTable` read: resolve the dynamic field
 * for the key, fetch its object json, and check the VecSet `contents` is
 * non-empty. Returns `false` when the key has no entry (not-found → not
 * subscribed); real RPC/transport failures propagate.
 */
export const isVeScaKeyInSubsTableFromOnChain = async (
  ctx: Pick<BaseContext, 'onchain' | 'fetchWithCache'>,
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
