import type ScallopQuery from 'src/models/scallopQuery.js';
import {
  queryMarket as queryMarketFn,
  getMarketPools as getMarketPoolsFn,
  getMarketPool as getMarketPoolFn,
  getMarketCollaterals as getMarketCollateralsFn,
  getMarketCollateral as getMarketCollateralFn,
} from 'src/queries/coreQuery.js';
import type {
  MarketRepository,
  MarketRepositoryOptions,
} from './marketRepository.js';
import type { QueryOptions } from 'src/utils/index.js';

export const createRpcMarketRepository = (
  query: ScallopQuery
): MarketRepository => {
  return {
    getMarket: (options?: MarketRepositoryOptions) =>
      queryMarketFn(query, false, options?.coinPrices),
    getMarketPools: (
      poolCoinNames?: string[],
      options?: MarketRepositoryOptions
    ) =>
      getMarketPoolsFn(
        query,
        poolCoinNames ?? [...query.constants.whitelist.lending],
        false,
        options?.coinPrices
      ),
    getMarketPool: async (
      poolCoinName: string,
      options?: MarketRepositoryOptions
    ) =>
      (
        await getMarketPoolFn(
          query,
          poolCoinName,
          false,
          options?.coinPrices?.[poolCoinName] ?? 0
        )
      )?.marketPool,
    getMarketCollaterals: (
      collateralCoinNames?: string[],
      _options?: QueryOptions
    ) =>
      getMarketCollateralsFn(
        query,
        collateralCoinNames ?? [...query.constants.whitelist.collateral],
        false
      ),
    getMarketCollateral: (
      collateralCoinName: string,
      _options?: QueryOptions
    ) => getMarketCollateralFn(query, collateralCoinName, false),
  };
};
