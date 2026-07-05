import { SuiClientTypes } from '@mysten/sui/client';
import {
  Obligation,
  ObligationDataContext,
  ObligationNamingContext,
  ObligationQueryInterface,
  ObligationsContext,
} from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import {
  computeNamingKey,
  getObligationFromObligationKey,
  mapObligationEventToObligationData,
} from './utils.js';
import { getSharedObjectData, parseObjectAs } from 'src/utils/object.js';
import { logError, type OnChainReadContext } from '../utils.js';
import { ScallopRpcError } from 'src/errors/index.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import type { SuiObjectData } from 'src/types/index.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { bcs } from '@mysten/sui/bcs';

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

  const getArg = async (objectId: string) => {
    const response = await fetchWithCache({
      queryKey: queryKeys.rpc.getObject({
        ...getFetchOptions(objectId),
        node: onchain.url,
      }),
      queryFn: () => onchain.getObject(getFetchOptions(objectId)),
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
        mutable: false,
        objectId: response.object,
      }
    );
  };

  const args = await Promise.all([
    getArg(version),
    getArg(market),
    getArg(obligationId),
  ]);
  tx.moveCall(queryTarget, [...args, tx.txBlock.object.clock()]);

  const queryArgs = [version, market, obligationId];
  const queryResult = await fetchWithCache({
    queryKey: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args: queryArgs,
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
      new ScallopRpcError(
        `Failed to query obligation data for obligationId ${obligationId}: ${transaction.status.error.message}`,
        { context: { obligationId } }
      )
    );
  }

  return mapObligationEventToObligationData(
    transaction?.events?.[0]?.json as unknown as
      | ObligationQueryInterface
      | undefined
  );
};

/**
 * Whether a single obligation is locked (has a `lock_key`). Returns `false`
 * for an unlocked obligation and only propagates real fetch failures — matching
 * the public `getObligationLocked` contract.
 */
export const getObligationLockedFromOnChain = async (
  ctx: OnChainReadContext,
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
  const obligationIds = obligationKeyObjects.map(
    getObligationFromObligationKey
  );
  const obligationObjects = await getObligationObjectsFromOnChain(
    ctx,
    obligationIds
  );

  return obligationKeyObjects.map<Obligation>((obj, index) => {
    const obligationObject = obligationObjects[index];
    const fields = obligationObject
      ? parseObjectAs<{ lock_key?: unknown }>(obligationObject)
      : undefined;

    return {
      id: obligationIds[index],
      keyId: obj.objectId,
      locked: Boolean(fields?.lock_key),
    };
  });
};

/**
 * Batch-fetch the raw obligation objects for the given ids in ONE getObjects
 * call. Order-preserving: a per-object fetch failure maps to `null` at its index
 * (callers fall back to the id), so indices stay aligned with the input array.
 */
export const getObligationObjectsFromOnChain = async (
  ctx: OnChainReadContext,
  ids: string[]
): Promise<(SuiObjectData | null)[]> => {
  if (ids.length === 0) return [];
  const { onchain, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectsOptions<{ json: true }> = {
    objectIds: ids,
    include: { json: true },
  };
  const { objects } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObjects({ objectIds: ids, node: onchain.url }),
    queryFn: () => onchain.client.getObjects(options),
  });
  return objects.map((object) => (object instanceof Error ? null : object));
};

export const getObligationNamesFromOnChain = async (
  ctx: ObligationNamingContext,
  address: string
) => {
  const {
    metadata: { addresses },
    fetchWithCache,
    onchain,
  } = ctx;

  const registryTableId = addresses.obligationNaming.registryTableId;

  // Fetch all obligation keys for the given address
  const keys = await queryObligationKeys(ctx, { address });

  const results = await Promise.all(
    keys.map(async (key) => {
      const computedKey = computeNamingKey(key.objectId, address);
      const options: SuiClientTypes.GetDynamicObjectFieldOptions<{
        json: true;
      }> = {
        parentId: registryTableId,
        name: encodeDynamicFieldNameForV2({
          type: '0x2::object::ID',
          value: computedKey,
        }),
        include: { json: true },
      };

      try {
        const { dynamicField } = await fetchWithCache({
          queryKey: queryKeys.rpc.getDynamicFieldObject({
            ...options,
            node: onchain.url,
          }),
          queryFn: () => onchain.client.getDynamicField(options),
        });

        return [
          key.objectId,
          bcs.string().parse(dynamicField.value.bcs),
        ] as const;
      } catch {
        // Obligation has no name set (missing dynamic field) or the fetch
        // failed — skip it instead of failing the whole batch.
        return null;
      }
    })
  );

  return Object.fromEntries(
    results.filter((r): r is readonly [string, string] => r !== null)
  );
};
