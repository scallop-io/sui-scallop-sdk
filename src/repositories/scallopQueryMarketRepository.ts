import type ScallopQuery from 'src/models/scallopQuery.js';
import type {
  MarketRepository,
  MarketRepositoryOptions,
} from './marketRepository.js';
import type { QueryOptions } from 'src/utils/index.js';

/**
 * Compatibility adapter, not a real data-source repository.
 *
 * This wraps the public `ScallopQuery` facade behind the `MarketRepository`
 * interface for older tests/internal call sites. New read paths should prefer a
 * concrete source adapter such as `indexerMarketRepository` or
 * `rpcMarketRepository`.
 */
export const createScallopQueryMarketRepository = (
  query: ScallopQuery
): MarketRepository => ({
  getMarket: (options?: MarketRepositoryOptions) =>
    query.getMarketPools(undefined, {
      coinPrices: options?.coinPrices,
      indexer: options?.indexer,
      source: options?.source,
    }),
  getMarketPools: (
    poolCoinNames?: string[],
    options?: MarketRepositoryOptions
  ) =>
    query.getMarketPools(poolCoinNames, {
      coinPrices: options?.coinPrices,
      indexer: options?.indexer,
      source: options?.source,
    }),
  getMarketPool: (poolCoinName: string, options?: MarketRepositoryOptions) =>
    query.getMarketPool(poolCoinName, {
      coinPrice: options?.coinPrices?.[poolCoinName],
      indexer: options?.indexer,
      source: options?.source,
    }),
  getMarketCollaterals: (
    collateralCoinNames?: string[],
    options?: QueryOptions
  ) =>
    query.getMarketCollaterals(collateralCoinNames, {
      indexer: options?.indexer,
      source: options?.source,
    }),
  getMarketCollateral: (collateralCoinName: string, options?: QueryOptions) =>
    query.getMarketCollateral(collateralCoinName, {
      indexer: options?.indexer,
      source: options?.source,
    }),
});
