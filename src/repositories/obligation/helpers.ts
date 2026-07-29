import { SuiClientTypes } from '@mysten/sui/client';
import {
  Obligation,
  ObligationDataContext,
  ObligationNamingContext,
  ObligationNamingGraphQLContext,
  ObligationQueryInterface,
  ObligationsContext,
} from './types.js';
import { fromBase64, toBase64 } from '@mysten/sui/utils';
import { queryKeys } from 'src/constants/queryKeys.js';
import {
  computeNamingKey,
  getObligationFromObligationKey,
  mapObligationEventToObligationData,
} from './utils.js';
import { getSharedObjectData, parseObjectAs } from 'src/utils/object.js';
import { logError, type GrpcReadContext } from '../utils.js';
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
  const { grpc, metadata, fetchWithCache } = ctx;
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
        // Namespace by node so reads against different fullnodes sharing one
        // QueryClient can't collide (matches the veSca owned-object key shape).
        queryKey: queryKeys.rpc.getOwnedObjects({
          ...options,
          node: grpc.url,
        }),
        queryFn: () => grpc.client.listOwnedObjects(options),
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
  const { grpc, fetchWithCache, metadata } = ctx;
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
        node: grpc.url,
      }),
      queryFn: () => grpc.getObject(getFetchOptions(objectId)),
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
      { grpc, fetchWithCache },
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
      node: grpc.url,
    }),
    queryFn: () =>
      grpc.client.simulateTransaction({
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
 * preserving the isolation of the caller's `allSettled` loop.
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
  const { grpc, fetchWithCache, metadata } = ctx;
  const { queryPackageId, version, market } = metadata.addresses;
  const queryTarget = `${queryPackageId}::obligation_query::obligation_data`;

  const tx = new SuiTxBlock();
  const getArg = async (objectId: string) => {
    const response = await fetchWithCache({
      queryKey: queryKeys.rpc.getObject({ objectId, node: grpc.url }),
      queryFn: () => grpc.getObject({ objectId }),
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
      { grpc, fetchWithCache },
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
      node: grpc.url,
    }),
    queryFn: () =>
      grpc.client.simulateTransaction({
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
  ctx: GrpcReadContext,
  obligationId: string
): Promise<boolean> => {
  const { grpc, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: obligationId,
    include: {
      json: true,
    },
  };
  const obligationObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject(options),
    queryFn: () => grpc.getObject(options),
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
  ctx: GrpcReadContext,
  ids: string[]
): Promise<(SuiObjectData | null)[]> => {
  if (ids.length === 0) return [];
  const { grpc, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectsOptions<{ json: true }> = {
    objectIds: ids,
    include: { json: true },
  };
  const { objects } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObjects({ objectIds: ids, node: grpc.url }),
    queryFn: () => grpc.client.getObjects(options),
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
    grpc,
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
              node: grpc.url,
            }),
            queryFn: () => grpc.client.getDynamicField(options),
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

/**
 * Native-GraphQL twin of {@link getObligationNamesFromOnChain}. The on-chain
 * path issues one `getDynamicField` per obligation key against the GLOBAL naming
 * registry (N round trips); this fetches all of them by name in a single aliased
 * GraphQL query (N→1). A full table scan is NOT used — the registry holds every
 * obligation's name, so scanning it to find one owner's few names would be far
 * worse. Output (obligationId → name, unnamed omitted) is identical.
 */
export const getObligationNamesFromGraphQL = async (
  ctx: ObligationNamingGraphQLContext,
  address: string
): Promise<Record<string, string>> => {
  const {
    metadata: { addresses },
    graphql,
  } = ctx;
  const registryTableId = addresses.obligationNaming.registryTableId;

  const keys = await queryObligationKeys(ctx, { address });
  if (keys.length === 0) return {};

  const names = keys.map((key) => {
    const encoded = encodeDynamicFieldNameForV2({
      type: '0x2::object::ID',
      value: computeNamingKey(key.objectId, address),
    });
    return { type: encoded.type, bcs: toBase64(encoded.bcs) };
  });

  const fields = await graphql.multiGetDynamicFields(registryTableId, names);

  const results: Record<string, string> = {};
  fields.forEach((field, index) => {
    if (!field || field.valueBcs === null) return; // unnamed obligation
    try {
      results[keys[index].objectId] = bcs
        .string()
        .parse(fromBase64(field.valueBcs));
    } catch {
      // Skip a field whose value doesn't parse as a name string.
    }
  });
  return results;
};
