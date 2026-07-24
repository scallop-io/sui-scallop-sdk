import { SuiClientTypes } from '@mysten/sui/client';
import { queryKeys } from 'src/constants/queryKeys.js';
import { SuiObjectData } from 'src/types/sui.js';
import { getDfObjectIdAndName, parseObjectAs } from 'src/utils/object.js';
import { FlashloanGraphQLContext, FlashloanRepoContext } from './types.js';
import { listDynamicFieldsWithValues, type GrpcReadContext } from '../utils.js';
import { bcs } from '@mysten/sui/bcs';
import { FEE_DENOMINATOR, FLASHLOAN_FEES_TABLE_ID } from './const.js';

const queryFlashloanFees = async (
  ctx: GrpcReadContext,
  {
    assetTypeMap,
  }: {
    assetTypeMap: Record<string, string>;
  }
) => {
  const { grpc, fetchWithCache } = ctx;

  let cursor: string | null | undefined = null;
  let nextPage: boolean = false;
  const ids: string[] = [];

  do {
    const inputs: SuiClientTypes.ListDynamicFieldsOptions = {
      parentId: FLASHLOAN_FEES_TABLE_ID,
      limit: 50,
      cursor,
    };
    const resp = await fetchWithCache({
      queryKey: queryKeys.rpc.getDynamicFields(inputs),
      queryFn: () => grpc.client.listDynamicFields(inputs),
    });

    if (!resp) break;

    // get the dynamic object ids
    const dynamicFieldObjectIds = resp.dynamicFields
      .filter((field) => {
        const assetType = `0x${bcs.string().parse(field.name.bcs)}`;
        return !!assetTypeMap[assetType];
      })
      .map((field) => field.fieldId);

    ids.push(...dynamicFieldObjectIds);
    nextPage = resp.hasNextPage;
    cursor = resp.cursor;
  } while (nextPage);

  if (ids.length === 0) {
    return [];
  }

  // fetch the dynamic objects in batch
  const include = {
    json: true,
  };

  const { objects: flashloanFeeObjects } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObjects({
      node: grpc.url,
      objectIds: ids,
    }),
    queryFn: () =>
      grpc.client.getObjects({
        objectIds: ids,
        include,
      }),
  });

  return flashloanFeeObjects;
};

export const getFlashloanFeesFromOnChain = async (
  ctx: FlashloanRepoContext,
  { assetNames }: { assetNames: string[] }
) => {
  const { metadata } = ctx;
  const assetNamesSet = new Set(assetNames);
  const assetTypeMap = Object.fromEntries(
    [...metadata.coinTypeToCoinNameMap.entries()].filter(([, coinName]) =>
      assetNamesSet.has(coinName)
    )
  );

  const flashloanFeeObjects = await queryFlashloanFees(ctx, {
    assetTypeMap,
  });

  return flashloanFeeObjects
    .filter((object): object is SuiObjectData => !(object instanceof Error))
    .reduce(
      (prev, curr) => {
        if (curr) {
          const { name } = getDfObjectIdAndName(curr);
          const assetType = `0x${name}`;
          const assetName = assetTypeMap[assetType];
          if (!assetName) return prev;

          const feeNumerator = +parseObjectAs<string>(curr);
          prev[assetName] = feeNumerator / FEE_DENOMINATOR;
        }
        return prev;
      },
      {} as Record<string, number>
    );
};

/**
 * Native-GraphQL twin of {@link getFlashloanFeesFromOnChain}. One
 * `listDynamicFieldsWithValues` scan of the flashloan-fee table returns each
 * fee's asset-type key and its numerator inline, replacing the on-chain
 * "list ids + batched getObjects" two-step. Output is identical.
 */
export const getFlashloanFeesFromGraphQL = async (
  ctx: FlashloanGraphQLContext,
  { assetNames }: { assetNames: string[] }
): Promise<Record<string, number>> => {
  const { metadata } = ctx;
  const assetNamesSet = new Set(assetNames);
  const assetTypeMap = Object.fromEntries(
    [...metadata.coinTypeToCoinNameMap.entries()].filter(([, coinName]) =>
      assetNamesSet.has(coinName)
    )
  );

  const fields = await listDynamicFieldsWithValues(
    ctx,
    FLASHLOAN_FEES_TABLE_ID
  );

  return fields.reduce(
    (prev, field) => {
      let assetType: string;
      try {
        assetType = `0x${bcs.string().parse(field.name.bcs)}`;
      } catch {
        return prev;
      }
      const assetName = assetTypeMap[assetType];
      if (!assetName) return prev;

      // Fee value is a scalar `u64` numerator, read inline from BCS — the same
      // numerator the on-chain path parses off the fetched Field object.
      const feeNumerator = Number(bcs.u64().parse(field.value.bcs));
      if (Number.isNaN(feeNumerator)) return prev;
      prev[assetName] = feeNumerator / FEE_DENOMINATOR;
      return prev;
    },
    {} as Record<string, number>
  );
};
