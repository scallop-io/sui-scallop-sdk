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
  const poolCoinType = utils.parseCoinType(poolName).slice(2);
  const marketObject = utils.address.get('core.market');
  const protocolObject = utils.address.get('core.packages.protocol.id');
  const supplyLimitKeyType = `${protocolObject}::market_dynamic_keys::SupplyLimitKey`;
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
};
