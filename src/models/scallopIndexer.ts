import {
  BorrowIncentivePool,
  BorrowIncentivePoolPoints,
  BorrowIncentivePools,
  Market,
  MarketCollateral,
  MarketCollaterals,
  MarketPool,
  MarketPools,
  Spool,
  Spools,
  TotalValueLocked,
} from 'src/types';
import ScallopAxios, { ScallopAxiosParams } from './scallopAxios';
import { queryKeys, SDK_API_BASE_URL } from 'src/constants';

export type ScallopIndexerParams = {
  indexerApiUrl?: string;
} & ScallopAxiosParams;

class ScallopIndexer extends ScallopAxios {
  constructor(params: ScallopIndexerParams = {}) {
    params.baseUrl = params.indexerApiUrl ?? SDK_API_BASE_URL;
    super(params);
  }

  /**
   * Get market index data.
   *
   * @return Market data.
   */
  async getMarket(): Promise<Pick<Market, 'pools' | 'collaterals'>> {
    const response = await this.get<{
      pools: MarketPool[];
      collaterals: MarketCollateral[];
    }>('/api/market/migrate', queryKeys.api.getMarket());

    if (response.status === 200) {
      return {
        pools: response.data.pools.reduce((marketPools, marketPool) => {
          marketPools[marketPool.coinName] = marketPool;
          return marketPools;
        }, {} as MarketPools),
        collaterals: response.data.collaterals.reduce(
          (marketCollaterals, marketCollateral) => {
            marketCollaterals[marketCollateral.coinName] = marketCollateral;
            return marketCollaterals;
          },
          {} as MarketCollaterals
        ),
      };
    } else {
      throw Error('Failed to getMarket.');
    }
  }

  /**
   * Get market pools index data.
   *
   * @return Market pools data.
   */
  async getMarketPools(): Promise<Required<MarketPools>> {
    const response = (await this.getMarket()).pools;
    return response as Required<MarketPools>;
  }

  /**
   * Get market pool index data.
   *
   * @return Market pool data.
   */
  async getMarketPool(poolCoinName: string): Promise<MarketPool> {
    return (await this.getMarketPools())[poolCoinName] as MarketPool;
  }

  /**
   * Get market collaterals index data.
   *
   * @return Market collaterals data.
   */
  async getMarketCollaterals(): Promise<Required<MarketCollaterals>> {
    return (await this.getMarket()).collaterals as Required<MarketCollaterals>;
  }

  /**
   * Get market collateral index data.
   *
   * @return Market collateral data.
   */
  async getMarketCollateral(
    collateralCoinName: string
  ): Promise<MarketCollateral> {
    return (await this.getMarketCollaterals())[
      collateralCoinName
    ] as MarketCollateral;
  }

  /**
   * Get spools index data.
   *
   * @return Spools data.
   */
  async getSpools(): Promise<Required<Spools>> {
    const response = await this.get<{
      spools: Spool[];
    }>('/api/spools/migrate', queryKeys.api.getSpools());

    if (response.status === 200) {
      return response.data.spools.reduce((spools, spool) => {
        spools[spool.marketCoinName] = spool;
        return spools;
      }, {} as Spools) as Required<Spools>;
    } else {
      throw Error('Failed to getSpools.');
    }
  }

  /**
   * Get spool index data.
   *
   * @return Spool data.
   */
  async getSpool(marketCoinName: string): Promise<Spool> {
    return (await this.getSpools())[marketCoinName] as Spool;
  }

  /**
   * Get borrow incentive pools index data.
   *
   * @return Borrow incentive pools data.
   */
  async getBorrowIncentivePools(): Promise<Required<BorrowIncentivePools>> {
    const response = await this.get<{
      borrowIncentivePools: BorrowIncentivePool[];
    }>(
      '/api/borrowIncentivePools/migrate',
      queryKeys.api.getBorrowIncentivePool()
    );

    if (response.status === 200) {
      return response.data.borrowIncentivePools.reduce(
        (borrowIncentivePools, borrowIncentivePool) => {
          if (Array.isArray(borrowIncentivePool.points)) {
            borrowIncentivePool.points = (
              borrowIncentivePool.points as BorrowIncentivePoolPoints[]
            ).reduce(
              (prev, curr) => {
                prev[curr.coinName] = curr;
                return prev;
              },
              {} as Record<string, BorrowIncentivePoolPoints>
            );
          }
          borrowIncentivePools[borrowIncentivePool.coinName] =
            borrowIncentivePool;
          return borrowIncentivePools;
        },
        {} as BorrowIncentivePools
      ) as Required<BorrowIncentivePools>;
    } else {
      throw Error('Failed to getBorrowIncentivePools.');
    }
  }

  /**
   * Get borrow incentive pool index data.
   *
   * @return Borrow incentive pool data.
   */
  async getBorrowIncentivePool(
    borrowIncentiveCoinName: string
  ): Promise<BorrowIncentivePool> {
    return (await this.getBorrowIncentivePools())[
      borrowIncentiveCoinName
    ] as BorrowIncentivePool;
  }

  /**
   * Get total value locked index data.
   *
   * @return Total value locked.
   */
  async getTotalValueLocked(): Promise<
    TotalValueLocked & {
      totalValueChangeRatio: number;
      borrowValueChangeRatio: number;
      supplyValueChangeRatio: number;
    }
  > {
    const response = await this.get<
      TotalValueLocked & {
        totalValueChangeRatio: number;
        borrowValueChangeRatio: number;
        supplyValueChangeRatio: number;
      }
    >(`/api/market/tvl`, queryKeys.api.getTotalValueLocked());

    if (response.status === 200) {
      return response.data;
    } else {
      throw Error('Failed to getTotalValueLocked.');
    }
  }

  /**
   * Get coin price index data.
   *
   * @return price data.
   */
  async getCoinPrice(poolCoinName: string): Promise<number> {
    return (await this.getMarketPool(poolCoinName))?.coinPrice ?? 0;
  }

  async getCoinPrices(): Promise<Record<string, number>> {
    const marketPools = await this.getMarketPools();
    return Object.entries(marketPools).reduce(
      (prev, [coinName, market]) => {
        if (market) prev[coinName] = market.coinPrice;
        return prev;
      },
      {} as Record<string, number>
    );
  }
}

export default ScallopIndexer;
