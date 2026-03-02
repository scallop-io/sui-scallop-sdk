import { ScallopQuery, ScallopUtils } from '../models/index.js';
import { z as zod } from 'zod';

const isolatedAssetZod = zod.object({
  value: zod.boolean(),
});

const isolatedAssetKeyType = `0xe7dbb371a9595631f7964b7ece42255ad0e738cc85fe6da26c7221b220f01af6::market_dynamic_keys::IsolatedAssetKey`; // prod
// const isolatedAssetKeyType = `0x6c23585e940a989588432509107e98bae06dbca4e333f26d0635d401b3c7c76d::market_dynamic_keys::IsolatedAssetKey`;

/**
 * Return list of isolated assets coin types
 * @param utils ScallopUtils
 * @returns list of isolated assets coin types
 */
export const getIsolatedAssets = async (
  query: ScallopQuery,
  useOnChainQuery: boolean = false
): Promise<string[]> => {
  if (!useOnChainQuery) {
    return query.utils
      .getSupportedPoolAddresses()
      .filter((t) => !!t.isolatedAssetKey)
      .map((t) => t.coinName);
  }

  try {
    const marketObject = query.address.get('core.market');
    const isolatedAssets: string[] = [];
    if (!marketObject) return isolatedAssets;

    let hasNextPage = false;
    let nextCursor: string | null | undefined = null;

    const isIsolatedDynamicField = (dynamicField: any) => {
      return dynamicField.type === isolatedAssetKeyType;
    };

    do {
      const response = await query.scallopSuiKit.queryGetDynamicFields({
        parentId: marketObject,
        cursor: nextCursor,
        limit: 10,
      });
      if (!response) break;

      const isolatedAssetCoinTypes = response.dynamicFields
        .filter(isIsolatedDynamicField)
        .map(({ name }: any) => `0x${name.value.type.name}`);
      isolatedAssets.push(...isolatedAssetCoinTypes);

      if (response && response.hasNextPage && response.cursor) {
        hasNextPage = true;
        nextCursor = response.cursor;
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
 * @param utils ScallopUtils
 * @param coinName coin name
 * @param useOnChainQuery whether to use on-chain query
 * @returns true if the coin type is an isolated asset
 */
export const isIsolatedAsset = async (
  utils: ScallopUtils,
  coinName: string,
  useOnChainQuery?: boolean
): Promise<boolean> => {
  const assetInPoolAddresses = utils.constants.poolAddresses[coinName];
  if (assetInPoolAddresses && !useOnChainQuery) {
    return assetInPoolAddresses.isIsolated;
  }

  const marketObject = utils.address.get('core.market');
  // check if the coin type is in the list
  const cachedData = utils.queryClient.getQueryData<string[]>([
    'getDynamicFields',
    marketObject,
  ]);
  if (cachedData) {
    const coinType = utils.parseCoinType(coinName);
    return cachedData.includes(coinType);
  }

  // fetch dynamic field object
  const coinType = utils.parseCoinType(coinName).slice(2);

  const object = await utils.scallopSuiKit.queryGetDynamicFieldObject({
    parentId: marketObject,
    name: {
      type: isolatedAssetKeyType,
      value: coinType,
    },
  });

  const parsedData = isolatedAssetZod.safeParse(object?.object?.json);
  if (!parsedData.success) return false;
  return parsedData.data.value;
};
