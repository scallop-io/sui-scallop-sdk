import { mapTypeNameField } from 'src/mappers/moveTypeMapper.js';
import type { MappedMarketQueryData, MarketQueryInterface } from './types.js';

export const mapMarketEventToMarketData = (
  raw: MarketQueryInterface | undefined
): MappedMarketQueryData | undefined => {
  if (!raw) return undefined;

  return {
    ...raw,
    pools: (raw.pools ?? []).map((pool, index) => ({
      ...pool,
      type: mapTypeNameField(pool.type, `market.pools[${index}].type`),
    })),
    collaterals: (raw.collaterals ?? []).map((collateral, index) => ({
      ...collateral,
      type: mapTypeNameField(
        collateral.type,
        `market.collaterals[${index}].type`
      ),
    })),
  };
};

// export const mapIndexerMarketData = (
//   data: IndexerMarket
// ): Omit<IndexerMarket, 'coinPrice'> => {
//   const { coinPrice: _, ...rest } = data;
//   return rest;
// };
