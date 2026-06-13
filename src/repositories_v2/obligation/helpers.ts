import { SuiClientTypes } from '@mysten/sui/client';
import {
  BindedObligationContext,
  Obligation,
  ObligationDataContext,
  ObligationQueryInterface,
  ObligationsContext,
} from './types.js';
import type { BaseContext } from '../type.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import {
  getLockKeyFromObligationObject,
  getObligationFromObligationKey,
  mapObligationEventToObligationData,
} from './utils.js';
import { getSharedObjectData, parseObjectAs } from 'src/utils/object.js';
import { logError } from '../util.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
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

export const getBindedObligation = async (
  ctx: BindedObligationContext,
  veScaKey: string
) => {
  const { onchain, metadata, fetchWithCache } = ctx;
  const { borrowIncentiveObject, incentivePools, veScaObject } =
    metadata.addresses;

  const fetchOptions: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: incentivePools,
    include: {
      json: true,
    },
  };

  const incentivePoolsObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject(fetchOptions),
    queryFn: () => onchain.getObject(fetchOptions),
  });

  if (!incentivePoolsObject.object) {
    throw logError(
      ctx.logger,
      `Failed to fetch incentive pool object with id ${incentivePools}`
    );
  }

  // get veSca bind table id
  const veScaBindTableId = parseObjectAs<{ ve_sca_bind: { id: string } }>(
    incentivePoolsObject.object
  ).ve_sca_bind.id;

  // Check if veSca is inside the bind table
  const keyType = `${borrowIncentiveObject}::typed_id::TypedID<${veScaObject}::ve_sca::VeScaKey>`;
  const veScaBindTableResponse = await fetchWithCache({
    queryKey: queryKeys.rpc.getDynamicFieldObject({
      parentId: veScaBindTableId,
      name: {
        type: keyType,
        value: veScaKey,
      },
    }),
    queryFn: () =>
      onchain.client.getDynamicField({
        parentId: veScaBindTableId,
        name: encodeDynamicFieldNameForV2({
          type: keyType,
          value: veScaKey,
        }),
      }),
  });

  return bcs.Address.parse(veScaBindTableResponse.dynamicField.value.bcs);
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
