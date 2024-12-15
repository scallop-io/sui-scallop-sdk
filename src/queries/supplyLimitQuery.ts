import { ScallopUtils } from 'src/models';
import { SupportPoolCoins } from 'src/types';
import { z as zod } from 'zod';

const supplyLimitZod = zod.object({
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
    value: zod.string(),
  }),
});

// TODO: enable for production
// const supplyLimitKeyType = `0x6e641f0dca8aedab3101d047e96439178f16301bf0b57fe8745086ff1195eb3e::market_dynamic_keys::SupplyLimitKey`; // prod
const supplyLimitKeyType = `0x6c23585e940a989588432509107e98bae06dbca4e333f26d0635d401b3c7c76d::market_dynamic_keys::SupplyLimitKey`;
/**
 * Return supply limit of a pool (including the decimals)
 * @param utils
 * @param poolName
 * @returns supply limit (decimals included)
 */
export const getSupplyLimit = async (
  utils: ScallopUtils,
  poolName: SupportPoolCoins
) => {
  try {
    const poolCoinType = utils.parseCoinType(poolName).slice(2);
    const marketObject = utils.address.get('core.market');
    if (!marketObject) return null;

    const object = await utils.cache.queryGetDynamicFieldObject({
      parentId: marketObject,
      name: {
        type: supplyLimitKeyType,
        value: poolCoinType,
      },
    });

    const parsedData = supplyLimitZod.safeParse(object?.data?.content);
    if (!parsedData.success) return null;
    return parsedData.data.fields.value;
  } catch (e: any) {
    console.error(`Error in getSupplyLimit for ${poolName}: ${e.message}`);
    return '0';
  }
};
