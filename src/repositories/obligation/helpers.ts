import { SuiClientTypes } from '@mysten/sui/client';
import {
  Obligation,
  ObligationDataContext,
  ObligationQueryInterface,
  ObligationsContext,
} from './types.js';
import type { BaseContext } from '../types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import {
  getLockKeyFromObligationObject,
  getObligationFromObligationKey,
  mapObligationEventToObligationData,
} from './utils.js';
import { getSharedObjectData, parseObjectAs } from 'src/utils/object.js';
import { logError } from '../utils.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';

const queryObligationKeys = async (
  ctx: ObligationsContext,
  {
    address,
  }: {
    address: string;
  }
) => {
  const { onchain, metadata, fetchWithCache } = ctx;
  const structType = `${metadata.addresses.protocolObjectId}::obligation::ObligationKey`;

  const objects: SuiClientTypes.Object<{ json: true }>[] = [];
  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;

  do {
    const options: SuiClientTypes.ListOwnedObjectsOptions = {
      owner: address,
      type: structType,
      include: {
        json: true,
      },
      limit: 50,
      cursor: nextCursor,
    };

    const response =
      await fetchWithCache<SuiClientTypes.ListOwnedObjectsResponse>({
        queryKey: queryKeys.rpc.getOwnedObjects(options),
        queryFn: () => onchain.client.listOwnedObjects(options),
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

export const queryObligationData = async (
  ctx: ObligationDataContext,
  obligationId: string
) => {
  const { onchain, fetchWithCache, metadata } = ctx;
  const { queryPackageId, version, market } = metadata.addresses;
  const queryTarget = `${queryPackageId}::obligation_query::obligation_data`;

  const tx = new SuiTxBlock();
  const getFetchOptions = (objectId: string) => {
    return {
      objectId,
      include: {
        json: false,
        content: false,
      },
    };
  };

  const args = await Promise.all([
    fetchWithCache({
      queryKey: queryKeys.rpc.getObject({
        ...getFetchOptions(version),
        node: onchain.url,
      }),
      queryFn: () =>
        getSharedObjectData(onchain, {
          tx,
          mutable: false,
          ...getFetchOptions(version),
        }),
    }),
    fetchWithCache({
      queryKey: queryKeys.rpc.getObject({
        ...getFetchOptions(market),
        node: onchain.url,
      }),
      queryFn: () =>
        getSharedObjectData(onchain, {
          tx,
          mutable: false,
          ...getFetchOptions(market),
        }),
    }),
    fetchWithCache({
      queryKey: queryKeys.rpc.getObject({
        ...getFetchOptions(obligationId),
        node: onchain.url,
      }),
      queryFn: () =>
        getSharedObjectData(onchain, {
          tx,
          mutable: false,
          ...getFetchOptions(obligationId),
        }),
    }),
  ]);
  tx.moveCall(queryTarget, [...args, tx.txBlock.object.clock()]);

  const queryResult = await fetchWithCache({
    queryKey: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args,
      node: onchain.url,
    }),
    queryFn: () =>
      onchain.client.simulateTransaction({
        transaction: tx.txBlock,
        include: {
          events: true,
        },
      }),
  });

  const transaction = queryResult.Transaction ?? queryResult.FailedTransaction;
  // Check status
  if (!transaction.status.success) {
    throw logError(
      ctx.logger,
      `Failed to query obligation data for obligationId ${obligationId}: ${transaction.status.error.message}`
    );
  }

  return mapObligationEventToObligationData(
    transaction?.events?.[0]?.json as unknown as
      | ObligationQueryInterface
      | undefined
  );
};

const getObligationLockStatus = async (
  ctx: BaseContext,
  obligationId: string
) => {
  const { onchain, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: obligationId,
    include: {
      json: true,
    },
  };
  const obligationObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject(options),
    queryFn: () => onchain.getObject(options),
  });

  return getLockKeyFromObligationObject(obligationObject.object);
};

/**
 * Whether a single obligation is locked (has a `lock_key`). Unlike
 * `getLockKeyFromObligationObject` (used by the list assembly, which throws on a
 * missing key), this returns `false` for an unlocked obligation and only
 * propagates real fetch failures — matching the public `getObligationLocked`
 * contract.
 */
export const getObligationLockedFromOnChain = async (
  ctx: BaseContext,
  obligationId: string
): Promise<boolean> => {
  const { onchain, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: obligationId,
    include: {
      json: true,
    },
  };
  const obligationObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject(options),
    queryFn: () => onchain.getObject(options),
  });

  const fields = parseObjectAs<{ lock_key?: unknown }>(obligationObject.object);
  return Boolean(fields?.lock_key);
};

export const getObligationsFromOnChain = async (
  ctx: ObligationsContext,
  {
    address,
  }: {
    address: string;
  }
) => {
  const obligationKeyObjects = await queryObligationKeys(ctx, { address });

  // Get obligation id from obligation key objects
  const lockStatuses = await Promise.allSettled(
    obligationKeyObjects.map(async (obj) => {
      const obligationId = getObligationFromObligationKey(obj);
      return getObligationLockStatus(ctx, obligationId);
    })
  );

  return obligationKeyObjects.map<Obligation>((obj, index) => {
    const obligationId = getObligationFromObligationKey(obj);
    const lockStatus = lockStatuses[index];

    return {
      id: obligationId,
      keyId: obj.objectId,
      locked: lockStatus.status === 'fulfilled' ? lockStatus.value : false,
    };
  });
};
