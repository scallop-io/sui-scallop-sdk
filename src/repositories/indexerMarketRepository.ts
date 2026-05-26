import type ScallopIndexer from 'src/models/scallopIndexer.js';
import type {
  MarketCollateral,
  MarketCollaterals,
  MarketPool,
  MarketPools,
} from 'src/types/index.js';
import type {
  MarketRepository,
  MarketRepositoryOptions,
} from './marketRepository.js';

const filterRecords = <T extends { coinName: string }>(
  records: Record<string, T | undefined>,
  coinNames?: string[]
) => {
  if (!coinNames) return records;
  return coinNames.reduce(
    (acc, coinName) => {
      acc[coinName] = records[coinName];
      return acc;
    },
    {} as Record<string, T | undefined>
  );
};

export const createIndexerMarketRepository = (
  indexer: ScallopIndexer
): MarketRepository => ({
  getMarket: () => indexer.getMarket(),
  getMarketPools: async (
    poolCoinNames?: string[],
    _options?: MarketRepositoryOptions
  ) => {
    const market = await indexer.getMarket();
    return {
      pools: filterRecords<MarketPool>(
        market.pools,
        poolCoinNames
      ) as MarketPools,
      collaterals: market.collaterals,
    };
  },
  getMarketPool: (poolCoinName: string) => indexer.getMarketPool(poolCoinName),
  getMarketCollaterals: async (collateralCoinNames?: string[]) =>
    filterRecords<MarketCollateral>(
      await indexer.getMarketCollaterals(),
      collateralCoinNames
    ) as MarketCollaterals,
  getMarketCollateral: (collateralCoinName: string) =>
    indexer.getMarketCollateral(collateralCoinName),
});
