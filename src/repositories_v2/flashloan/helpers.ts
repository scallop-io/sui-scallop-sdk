import { SuiClientTypes } from '@mysten/sui/client';
import { queryKeys } from 'src/constants/queryKeys.js';
import { SuiObjectData } from 'src/types/sui.js';
import { getDfObjectIdAndName, parseObjectAs } from 'src/utils/object.js';
import { FlashloanRepoContext } from './types.js';
import type { BaseContext } from '../type.js';
import { bcs } from '@mysten/sui/bcs';

const FEE_DENOMINATOR = 1e4;
const FLASHLOAN_FEES_TABLE_ID =
  '0x00481a93b819d744a7d79ecdc6c62c74f2f7cb4779316c4df640415817ac61bb' as const;

const queryFlashloanFees = async (
  ctx: BaseContext,
  {
    assetTypeMap,
  }: {
    assetTypeMap: Record<string, string>;
  }
) => {
  const { onchain, fetchWithCache } = ctx;

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
      queryFn: () => onchain.client.listDynamicFields(inputs),
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
      node: onchain.url,
      objectIds: ids,
    }),
    queryFn: () =>
      onchain.client.getObjects({
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
