import { ScallopUtils } from 'src/models/index.js';
import { parseObjectAs } from 'src/utils/index.js';

const borrowLimitKeyType = `0xe7dbb371a9595631f7964b7ece42255ad0e738cc85fe6da26c7221b220f01af6::market_dynamic_keys::BorrowLimitKey`; // prod
// const borrowLimitKeyType = `0xb784ea287d944e478a3ceaa071f8885072cce6b7224cf245914dc2f9963f460e::market_dynamic_keys::BorrowLimitKey`;

/**
 * Return supply limit of a pool (including the decimals)
 * @param utils
 * @param poolName
 * @returns supply limit (decimals included)
 */
export const getBorrowLimit = async (utils: ScallopUtils, poolName: string) => {
  try {
    const poolCoinType = utils.parseCoinType(poolName).slice(2);
    const marketObject = utils.address.get('core.market');
    if (!marketObject) return null;

    const object = await utils.scallopSuiKit.queryGetDynamicFieldObject({
      parentId: marketObject,
      name: {
        type: borrowLimitKeyType,
        value: poolCoinType,
      },
    });

    if (!object?.object?.json) return '0';
    return parseObjectAs<string>(object.object);
  } catch (e: any) {
    console.error(`Error in getBorrowLimit for ${poolName}: ${e.message}`);
    return '0';
  }
};
