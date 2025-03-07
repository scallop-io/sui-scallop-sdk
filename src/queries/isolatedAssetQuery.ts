import { DynamicFieldInfo, DynamicFieldName } from '@mysten/sui/client';
import { ScallopQuery, ScallopUtils } from '../models';
import { SupportPoolCoins } from '../types';
import { z as zod } from 'zod';
import { POOL_ADDRESSES, SUPPORT_POOLS } from 'src/constants';

const isolatedAssetZod = zod.object({
  dataType: zod.string(),
  type: zod.string(),
  hasPublicTransfer: zod.boolean(),
  fields: zod.object({
    id: zod.object({
      id: zod.string(),
    }),
    name: zod.object({
      type: zod.string(),
    }),
    value: zod.boolean(),
  }),
});

const isolatedAssetKeyType = `0xe7dbb371a9595631f7964b7ece42255ad0e738cc85fe6da26c7221b220f01af6::market_dynamic_keys::IsolatedAssetKey`; // prod
// const isolatedAssetKeyType = `0x6c23585e940a989588432509107e98bae06dbca4e333f26d0635d401b3c7c76d::market_dynamic_keys::IsolatedAssetKey`;

/**
 * Return list of isolated assets coin types
 * @param utils ScallopUtils
 * @returns list of isolated assets coin types
 */
export const getIsolatedAssets = async (
  query: ScallopQuery
): Promise<string[]> => {
  if (SUPPORT_POOLS.every((t) => !!POOL_ADDRESSES[t])) {
    return SUPPORT_POOLS.filter(
      (t): t is typeof t & { coinType: string; isolatedAssetKey: string } =>
        !!POOL_ADDRESSES[t]?.isolatedAssetKey && !!POOL_ADDRESSES[t]?.coinType
    ).map((t) => POOL_ADDRESSES[t as SupportPoolCoins]?.coinType!);
  }
  try {
    const marketObject = query.address.get('core.market');
    const isolatedAssets: string[] = [];
    if (!marketObject) return isolatedAssets;

    let hasNextPage = false;
    let nextCursor: string | null | undefined = null;

    const isIsolatedDynamicField = (
      dynamicField: DynamicFieldInfo
    ): dynamicField is DynamicFieldInfo & {
      name: DynamicFieldName & { value: { type: { name: string } } };
    } => {
      return dynamicField.name.type === isolatedAssetKeyType;
    };

    do {
      const response = await query.cache.queryGetDynamicFields({
        parentId: marketObject,
        cursor: nextCursor,
        limit: 10,
      });
      if (!response) break;

      const isolatedAssetCoinTypes = response.data
        .filter(isIsolatedDynamicField)
        .map(({ name }) => `0x${name.value.type.name}`);
      isolatedAssets.push(...isolatedAssetCoinTypes);

      if (response && response.hasNextPage && response.nextCursor) {
        hasNextPage = true;
        nextCursor = response.nextCursor;
      } else {
        hasNextPage = false;
      }
    } while (hasNextPage);
    return isolatedAssets;
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * Check if the coin type is an isolated asset
 * @param coinName coin name
 * @returns true if the coin type is an isolated asset
 */
export const isIsolatedAsset = async (
  utils: ScallopUtils,
  coinName: SupportPoolCoins
): Promise<boolean> => {
  if (POOL_ADDRESSES[coinName]) {
    return !!POOL_ADDRESSES[coinName].isolatedAssetKey;
  }

  const marketObject = utils.address.get('core.market');
  // check if the coin type is in the list
  const cachedData = utils.address.cache.queryClient.getQueryData<string[]>([
    'getDynamicFields',
    marketObject,
  ]);
  if (cachedData) {
    const coinType = utils.parseCoinType(coinName);
    return cachedData.includes(coinType);
  }

  // fetch dynamic field object
  const coinType = utils.parseCoinType(coinName).slice(2);

  const object = await utils.cache.queryGetDynamicFieldObject({
    parentId: marketObject,
    name: {
      type: isolatedAssetKeyType,
      value: coinType,
    },
  });

  const parsedData = isolatedAssetZod.safeParse(object?.data?.content);
  if (!parsedData.success) return false;
  return parsedData.data.fields.value;
};
