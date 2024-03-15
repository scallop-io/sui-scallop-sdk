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
} from '../types';
import { scallopQueryClient } from 'src/queries/client';

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
  private _requestClient: AxiosInstance;
  public readonly params: ScallopQueryParams;

  public constructor(params: ScallopParams) {
    this.params = params;
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
    // const response = await this._requestClient.get<{
    //   pools: MarketPool[];
    //   collaterals: MarketCollateral[];
    // }>(`${SDK_API_BASE_URL}/api/market`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['market'],
      queryFn: async () => {
        return await this._requestClient.get<{
          pools: MarketPool[];
          collaterals: MarketCollateral[];
        }>(`${SDK_API_BASE_URL}/api/market`);
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
    // const response = await this._requestClient.get<{
    //   pools: MarketPool[];
    // }>(`${SDK_API_BASE_URL}/api/market/pools`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['marketPools'],
      queryFn: async () => {
        return await this._requestClient.get<{
          pools: MarketPool[];
        }>(`${SDK_API_BASE_URL}/api/market/pools`);
      },
    });
    if (response.status === 200) {
      return response.data.pools.reduce((marketPools, marketPool) => {
        marketPools[marketPool.coinName] = marketPool;
        return marketPools;
      }, {} as MarketPools) as Required<MarketPools>;
    } else {
      throw Error('Failed to getMarketPools.');
    }
  }

  /**
   * Get market pool index data.
   *
   * @return Market pool data.
   */
  public async getMarketPool(
    poolCoinName: SupportPoolCoins
  ): Promise<MarketPool> {
    // const response = await this._requestClient.get<{
    //   pool: MarketPool;
    // }>(`${SDK_API_BASE_URL}/api/market/pool/${poolCoinName}`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['marketPool', poolCoinName],
      queryFn: async () => {
        return await this._requestClient.get<{
          pool: MarketPool;
        }>(`${SDK_API_BASE_URL}/api/market/pool/${poolCoinName}`);
      },
    });
    if (response.status === 200) {
      return response.data.pool;
    } else {
      throw Error('Failed to getMarketPool.');
    }
  }

  /**
   * Get market collaterals index data.
   *
   * @return Market collaterals data.
   */
  public async getMarketCollaterals(): Promise<Required<MarketCollaterals>> {
    // const response = await this._requestClient.get<{
    //   collaterals: MarketCollateral[];
    // }>(`${SDK_API_BASE_URL}/api/market/collaterals`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['marketCollaterals'],
      queryFn: async () => {
        return await this._requestClient.get<{
          collaterals: MarketCollateral[];
        }>(`${SDK_API_BASE_URL}/api/market/collaterals`);
      },
    });

    if (response.status === 200) {
      return response.data.collaterals.reduce(
        (marketCollaterals, marketCollateral) => {
          marketCollaterals[marketCollateral.coinName] = marketCollateral;
          return marketCollaterals;
        },
        {} as MarketCollaterals
      ) as Required<MarketCollaterals>;
    } else {
      throw Error('Failed to getMarketCollaterals.');
    }
  }

  /**
   * Get market collateral index data.
   *
   * @return Market collateral data.
   */
  public async getMarketCollateral(
    collateralCoinName: SupportCollateralCoins
  ): Promise<MarketCollateral> {
    // const response = await this._requestClient.get<{
    //   collateral: MarketCollateral;
    // }>(`${SDK_API_BASE_URL}/api/market/collateral/${collateralCoinName}`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['marketCollateral', collateralCoinName],
      queryFn: async () => {
        return await this._requestClient.get<{
          collateral: MarketCollateral;
        }>(`${SDK_API_BASE_URL}/api/market/collateral/${collateralCoinName}`);
      },
    });
    if (response.status === 200) {
      return response.data.collateral;
    } else {
      throw Error('Failed to getMarketCollateral.');
    }
  }

  /**
   * Get spools index data.
   *
   * @return Spools data.
   */
  public async getSpools(): Promise<Required<Spools>> {
    // const response = await this._requestClient.get<{
    //   spools: Spool[];
    // }>(`${SDK_API_BASE_URL}/api/spools`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['spools'],
      queryFn: async () => {
        return await this._requestClient.get<{
          spools: Spool[];
        }>(`${SDK_API_BASE_URL}/api/spools`);
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
    // const response = await this._requestClient.get<{
    //   spool: Spool;
    // }>(`${SDK_API_BASE_URL}/api/spool/${marketCoinName}`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['spool', marketCoinName],
      queryFn: async () => {
        return await this._requestClient.get<{
          spool: Spool;
        }>(`${SDK_API_BASE_URL}/api/spool/${marketCoinName}`);
      },
    });
    if (response.status === 200) {
      return response.data.spool;
    } else {
      throw Error('Failed to getSpool.');
    }
  }

  /**
   * Get borrow incentive pools index data.
   *
   * @return Borrow incentive pools data.
   */
  public async getBorrowIncentivePools(): Promise<
    Required<BorrowIncentivePools>
  > {
    // const response = await this._requestClient.get<{
    //   borrowIncentivePools: BorrowIncentivePool[];
    // }>(`${SDK_API_BASE_URL}/api/borrowIncentivePools`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['borrowIncentivePools'],
      queryFn: async () => {
        return await this._requestClient.get<{
          borrowIncentivePools: BorrowIncentivePool[];
        }>(`${SDK_API_BASE_URL}/api/borrowIncentivePools`);
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
    // const response = await this._requestClient.get<{
    //   borrowIncentivePool: BorrowIncentivePool;
    // }>(
    //   `${SDK_API_BASE_URL}/api/borrowIncentivePool/${borrowIncentiveCoinName}`
    // );

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['borrowIncentivePool', borrowIncentiveCoinName],
      queryFn: async () => {
        return await this._requestClient.get<{
          borrowIncentivePool: BorrowIncentivePool;
        }>(
          `${SDK_API_BASE_URL}/api/borrowIncentivePool/${borrowIncentiveCoinName}`
        );
      },
    });

    if (response.status === 200) {
      return response.data.borrowIncentivePool;
    } else {
      throw Error('Failed to getSpool.');
    }
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
    // const response = await this._requestClient.get<
    //   TotalValueLocked & {
    //     totalValueChangeRatio: number;
    //     borrowValueChangeRatio: number;
    //     supplyValueChangeRatio: number;
    //   }
    // >(`${SDK_API_BASE_URL}/api/market/tvl`);

    const response = await scallopQueryClient.fetchQuery({
      queryKey: ['totalValueLocked'],
      queryFn: async () => {
        return await this._requestClient.get<
          TotalValueLocked & {
            totalValueChangeRatio: number;
            borrowValueChangeRatio: number;
            supplyValueChangeRatio: number;
          }
        >(`${SDK_API_BASE_URL}/api/market/tvl`);
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw Error('Failed to getTotalValueLocked.');
    }
  }
}
