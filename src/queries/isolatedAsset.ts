import { DynamicFieldInfo, DynamicFieldName } from '@mysten/sui/client';
import { ScallopAddress, ScallopUtils } from 'src/models';
import { SupportPoolCoins } from 'src/types';
import { z as zod } from 'zod';

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

const ISOLATED_ASSET_KEY =
  '0x6e641f0dca8aedab3101d047e96439178f16301bf0b57fe8745086ff1195eb3e::market_dynamic_keys::IsolatedAssetKey';

/**
 * Return list of isolated assets coin types
 * @param utils ScallopUtils
 * @returns list of isolated assets coin types
 */
export const getIsolatedAssets = async (
  address: ScallopAddress
): Promise<string[]> => {
  const marketObject = address.get('core.market');
  const isolatedAssets: string[] = [];
  if (!marketObject) return isolatedAssets;

  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;

  const isIsolatedDynamicField = (
    dynamicField: DynamicFieldInfo
  ): dynamicField is DynamicFieldInfo & {
    name: DynamicFieldName & { value: { type: { name: string } } };
  } => {
    return dynamicField.name.type === ISOLATED_ASSET_KEY;
  };

  do {
    const response = await address.cache.queryGetDynamicFields({
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
  try {
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
        type: ISOLATED_ASSET_KEY,
        value: coinType,
      },
    });

    const parsedData = isolatedAssetZod.safeParse(object?.data?.content);
    if (!parsedData.success) return false;
    return parsedData.data.fields.value;
  } catch (e) {
    console.error(e);
    return false;
  }
};
