import axios, { AxiosInstance } from 'axios';
import { SDK_API_BASE_URL } from '../constants';
import type {
  Market,
  MarketPools,
  MarketPool,
  MarketCollaterals,
  MarketCollateral,
  Spools,
  Spool,
  BorrowIncentivePools,
  BorrowIncentivePool,
  SupportPoolCoins,
  SupportCollateralCoins,
  SupportStakeMarketCoins,
  SupportBorrowIncentiveCoins,
  TotalValueLocked,
  ScallopQueryParams,
  ScallopParams,
  ScallopInstanceParams,
} from '../types';
import { ScallopCache } from './scallopCache';

/**
 * @description
 * It provides methods to obtain sdk index data from mainnet.
 *
 *
 * @example
 * ```typescript
 * const scallopIndexer = new scallopIndexer(<parameters>);
 * scallopIndexer.<indexer functions>();
 * await scallopIndexer.<indexer async functions>();
 * ```
 */
export class ScallopIndexer {
  private readonly _cache: ScallopCache;
  public readonly params: ScallopQueryParams;
  private readonly _requestClient: AxiosInstance;

  public constructor(params: ScallopParams, instance?: ScallopInstanceParams) {
    this.params = params;
    this._cache = instance?.cache ?? new ScallopCache();
    this._requestClient = axios.create({
      baseURL: SDK_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Get market index data.
   *
   * @return Market data.
   */
  public async getMarket(): Promise<Pick<Market, 'pools' | 'collaterals'>> {
    const response = await this._cache.queryClient.fetchQuery({
      queryKey: ['market'],
      queryFn: async () => {
        return await this._requestClient.get<{
          pools: MarketPool[];
          collaterals: MarketCollateral[];
        }>(`/api/market`);
      },
    });

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
  public async getMarketPools(): Promise<Required<MarketPools>> {
    const response = (await this.getMarket()).pools;
    return response as Required<MarketPools>;
  }

  /**
   * Get market pool index data.
   *
   * @return Market pool data.
   */
  public async getMarketPool(
    poolCoinName: SupportPoolCoins
  ): Promise<MarketPool> {
    return (await this.getMarketPools())[poolCoinName] as MarketPool;
  }

  /**
   * Get market collaterals index data.
   *
   * @return Market collaterals data.
   */
  public async getMarketCollaterals(): Promise<Required<MarketCollaterals>> {
    return (await this.getMarket()).collaterals as Required<MarketCollaterals>;
  }

  /**
   * Get market collateral index data.
   *
   * @return Market collateral data.
   */
  public async getMarketCollateral(
    collateralCoinName: SupportCollateralCoins
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
  public async getSpools(): Promise<Required<Spools>> {
    const response = await this._cache.queryClient.fetchQuery({
      queryKey: ['spools'],
      queryFn: async () => {
        return await this._requestClient.get<{
          spools: Spool[];
        }>(`/api/spools`);
      },
    });

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
  public async getSpool(
    marketCoinName: SupportStakeMarketCoins
  ): Promise<Spool> {
    return (await this.getSpools())[marketCoinName] as Spool;
  }

  /**
   * Get borrow incentive pools index data.
   *
   * @return Borrow incentive pools data.
   */
  public async getBorrowIncentivePools(): Promise<
    Required<BorrowIncentivePools>
  > {
    const response = await this._cache.queryClient.fetchQuery({
      queryKey: ['borrowIncentivePools'],
      queryFn: async () => {
        return await this._requestClient.get<{
          borrowIncentivePools: BorrowIncentivePool[];
        }>(`/api/borrowIncentivePools`);
      },
    });

    if (response.status === 200) {
      return response.data.borrowIncentivePools.reduce(
        (borrowIncentivePools, borrowIncentivePool) => {
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
  public async getBorrowIncentivePool(
    borrowIncentiveCoinName: SupportBorrowIncentiveCoins
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
  public async getTotalValueLocked(): Promise<
    TotalValueLocked & {
      totalValueChangeRatio: number;
      borrowValueChangeRatio: number;
      supplyValueChangeRatio: number;
    }
  > {
    const response = await this._cache.queryClient.fetchQuery({
      queryKey: ['totalValueLocked'],
      queryFn: async () => {
        return await this._requestClient.get<
          TotalValueLocked & {
            totalValueChangeRatio: number;
            borrowValueChangeRatio: number;
            supplyValueChangeRatio: number;
          }
        >(`/api/market/tvl`);
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw Error('Failed to getTotalValueLocked.');
    }
  }
}
