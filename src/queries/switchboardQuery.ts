import { ScallopQuery } from 'src/models';

export const getOnDemandAggObjectIds = async (
  query: ScallopQuery,
  coinNames: string[],
  switchboardRegistryTableId: string = query.address.get(
    'core.oracles.switchboard.registryTableId'
  )
): Promise<string[]> => {
  const missingAgg: Array<{
    idx: number;
    coinName: string;
  }> = [];

  // Check if Aggregator is already registered in Address API
  const registeredAggs = coinNames.map((coinName, idx) => {
    const registeredAgg = query.utils.address.get(
      `core.coins.${coinName}.oracle.switchboard`
    );
    if (registeredAgg) {
      return registeredAgg;
    } else {
      missingAgg.push({
        idx,
        coinName,
      });
      return null;
    }
  });

  if (missingAgg.length === 0) return registeredAggs;

  // If not, query from the registry table
  const missingCoinNames = missingAgg.map((agg) => agg.coinName);
  const coinTypes = missingCoinNames.map((coinName) => {
    const coinType = query.utils.parseCoinType(coinName);
    if (!coinType) throw new Error(`Invalid coin name: ${coinName}`);
    return coinType;
  });

  await Promise.all(
    coinTypes.map(async (coinType, idx) => {
      const dfName = {
        type: '0x1::type_name::TypeName',
        value: {
          name: coinType.slice(2),
        },
      };

      const resp = await query.scallopSuiKit.queryGetDynamicFieldObject({
        parentId: switchboardRegistryTableId,
        name: dfName,
      });

      if (!resp?.data?.content || resp.data.content.dataType !== 'moveObject')
        throw new Error(`No on-demand aggregator found for ${coinType}`);

      const content = resp.data.content;
      registeredAggs[idx] = (content.fields as any).value;
    })
  );

  return registeredAggs;
};
