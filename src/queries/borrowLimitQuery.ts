import { ScallopUtils } from 'src/models';
import { SupportPoolCoins } from 'src/types';
import { z as zod } from 'zod';

const borrowLimitZod = zod.object({
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

// const borrowLimitKeyType = `${protocolObject}::market_dynamic_keys::BorrowLimitKey`;
// TODO: use prod value
const borrowLimitKeyType = `0xb784ea287d944e478a3ceaa071f8885072cce6b7224cf245914dc2f9963f460e::market_dynamic_keys::BorrowLimitKey`;
/**
 * Return supply limit of a pool (including the decimals)
 * @param utils
 * @param poolName
 * @returns supply limit (decimals included)
 */
export const getBorrowLimit = async (
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
        type: borrowLimitKeyType,
        value: poolCoinType,
      },
    });

    const parsedData = borrowLimitZod.safeParse(object?.data?.content);
    if (!parsedData.success) return null;
    return parsedData.data.fields.value;
  } catch (e: any) {
    console.error(`Error in getBorrowLimit for ${poolName}: ${e.message}`);
    return '0';
  }
};
