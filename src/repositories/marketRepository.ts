import type { QueryOptions } from 'src/utils/index.js';
import type {
  CoinPrices,
  Market,
  MarketCollateral,
  MarketCollaterals,
  MarketPool,
  MarketPools,
} from 'src/types/index.js';

export type MarketRepositoryOptions = QueryOptions & {
  coinPrices?: CoinPrices;
};

export interface MarketRepository {
  getMarket(options?: MarketRepositoryOptions): Promise<Market>;
  getMarketPools(
    poolCoinNames?: string[],
    options?: MarketRepositoryOptions
  ): Promise<{ pools: MarketPools; collaterals: MarketCollaterals }>;
  getMarketPool(
    poolCoinName: string,
    options?: MarketRepositoryOptions
  ): Promise<MarketPool | undefined>;
  getMarketCollaterals(
    collateralCoinNames?: string[],
    options?: QueryOptions
  ): Promise<MarketCollaterals>;
  getMarketCollateral(
    collateralCoinName: string,
    options?: QueryOptions
  ): Promise<MarketCollateral | undefined>;
}
