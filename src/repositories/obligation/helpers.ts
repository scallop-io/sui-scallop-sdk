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
  // Ref-only read: `getSharedObjectData` needs just the object reference
  // (objectId/version/owner), not `json`/`content`. Fetch with NO `include` so
  // this shares one cache entry with the identical sibling reads in
  // `veSca`/`borrowIncentive` `getArg` — the shared `version`/`market` objects
  // are read across all three flows in one portfolio load, and a bespoke
  // `{json:false,content:false}` selection forked the cache key (a distinct
  // getObject key ⇒ redundant RPC) for zero payload benefit.
  const getFetchOptions = (objectId: string) => ({ objectId });

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

type ObligationDataResult = Awaited<ReturnType<typeof queryObligationData>>;

/**
 * Batched sibling of {@link queryObligationData}. `obligation_data` takes
 * `(version, market, obligation, clock)` where only `obligation` varies, so N
 * obligations collapse into ONE PTB of N `moveCall`s and a single
 * `simulateTransaction` — instead of N devInspect round-trips — with the shared
 * `version`/`market` args resolved once for the whole batch. `devInspect` emits
 * events in command order, so `events[i]` maps back to `obligationIds[i]`.
 *
 * A whole-PTB abort (one bad obligation fails the transaction) or an event-count
 * mismatch (can't safely position results) falls back to per-obligation queries,
 * preserving the isolation the caller's `allSettled` loop previously had.
 */
export const queryObligationsData = async (
  ctx: ObligationDataContext,
  obligationIds: string[]
): Promise<Record<string, ObligationDataResult>> => {
  if (obligationIds.length === 0) return {};
  // A single obligation has no batching upside — use the isolated path directly.
  if (obligationIds.length === 1) {
    const id = obligationIds[0];
    return { [id]: await queryObligationData(ctx, id) };
  }

  try {
    return await queryObligationsDataBatched(ctx, obligationIds);
  } catch (error) {
    ctx.logger?.warn(
      'Batched obligation_data query failed; falling back to per-obligation',
      {
        obligations: obligationIds.length,
        error: error instanceof Error ? error.message : String(error),
      }
    );
    const entries = await Promise.all(
      obligationIds.map(async (id) => {
        try {
          return [id, await queryObligationData(ctx, id)] as const;
        } catch {
          return [id, undefined] as const;
        }
      })
    );
    return Object.fromEntries(entries);
  }
};

const queryObligationsDataBatched = async (
  ctx: ObligationDataContext,
  obligationIds: string[]
): Promise<Record<string, ObligationDataResult>> => {
  const { onchain, fetchWithCache, metadata } = ctx;
  const { queryPackageId, version, market } = metadata.addresses;
  const queryTarget = `${queryPackageId}::obligation_query::obligation_data`;

  const tx = new SuiTxBlock();
  const getArg = async (objectId: string) => {
    const response = await fetchWithCache({
      queryKey: queryKeys.rpc.getObject({ objectId, node: onchain.url }),
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
      { tx, mutable: false, objectId: response.object }
    );
  };

  // Shared args resolved ONCE; only the obligation arg differs per moveCall.
  const [versionArg, marketArg] = await Promise.all([
    getArg(version),
    getArg(market),
  ]);
  const clock = tx.txBlock.object.clock();
  const obligationArgs = await Promise.all(
    obligationIds.map((objectId) => getArg(objectId))
  );
  for (const obligationArg of obligationArgs) {
    tx.moveCall(queryTarget, [versionArg, marketArg, obligationArg, clock]);
  }

  const queryResult = await fetchWithCache({
    queryKey: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args: [version, market, ...obligationIds],
      node: onchain.url,
    }),
    queryFn: () =>
      onchain.client.simulateTransaction({
        transaction: tx.txBlock,
        include: { events: true },
      }),
  });

  const transaction = queryResult.Transaction ?? queryResult.FailedTransaction;
  if (!transaction.status.success) {
    throw new ScallopRpcError(
      `Batched obligation_data query failed: ${transaction.status.error?.message ?? 'unknown'}`,
      { context: { obligationIds } }
    );
  }

  const events = transaction.events ?? [];
  // Positional mapping is only safe when every moveCall produced its event.
  if (events.length !== obligationIds.length) {
    throw new ScallopRpcError(
      `Batched obligation_data returned ${events.length} events for ${obligationIds.length} obligations`,
      { context: { obligationIds } }
    );
  }

  const result: Record<string, ObligationDataResult> = {};
  obligationIds.forEach((id, index) => {
    result[id] = mapObligationEventToObligationData(
      events[index]?.json as unknown as ObligationQueryInterface | undefined
    );
  });
  return result;
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
        const { dynamicField } = await fetchWithCache(
          {
            queryKey: queryKeys.rpc.getDynamicFieldObject({
              ...options,
              node: onchain.url,
            }),
            queryFn: () => onchain.client.getDynamicField(options),
          },
          // An unnamed obligation legitimately has no dynamic field; the miss is
          // handled below, so don't log it as an error.
          { logErrors: false }
        );

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
