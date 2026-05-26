import { ScallopUtils } from 'src/models/index.js';
import { parseObjectAs } from 'src/utils/index.js';

const supplyLimitKeyType = `0x6e641f0dca8aedab3101d047e96439178f16301bf0b57fe8745086ff1195eb3e::market_dynamic_keys::SupplyLimitKey`; // prod
// const supplyLimitKeyType = `0x6c23585e940a989588432509107e98bae06dbca4e333f26d0635d401b3c7c76d::market_dynamic_keys::SupplyLimitKey`;
/**
 * Return supply limit of a pool (including the decimals)
 * @param utils
 * @param poolName
 * @returns supply limit (decimals included)
 */
export const getSupplyLimit = async (utils: ScallopUtils, poolName: string) => {
  try {
    const poolCoinType = utils.parseCoinType(poolName).slice(2);
    const marketObject = utils.address.get('core.market');
    if (!marketObject) return null;

    const object = await utils.scallopSuiKit.queryGetDynamicFieldObject({
      parentId: marketObject,
      name: {
        type: supplyLimitKeyType,
        value: poolCoinType,
      },
    });

    if (!object?.object?.json) return '0';
    return parseObjectAs<string>(object.object);
  } catch (e: any) {
    utils.logger.error(`getSupplyLimit failed for ${poolName}`, {
      message: e?.message,
    });
    return '0';
  }
};
