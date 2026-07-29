/**
 * pools
 * collaterals
 * pool addresses
 * supply/borrow limits
 * isolated assets
 * market object reads
 */

import { IndexerDataSource } from 'src/datasources/indexer.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import {
  QuerySource,
  runWithDataSourceFallback,
} from 'src/repositories/utils.js';
import { BaseRepository } from '../base.js';
import {
  getBorrowLimit,
  getMarketFromIndexer,
  getMarketFromOnChain,
  getMarketsFromIndexer,
  getMarketsFromOnChain,
  getSupplyLimit,
  getTvlFromIndexer,
  getTvlFromOnChain,
} from './helpers.js';
import {
  MarketReadArgs,
  MarketRepoAddressConfig,
  MarketRepoParams,
  MarketRepoContext,
  MarketRepoMetadata,
} from './types.js';

export class MarketRepository extends BaseRepository<
  MarketRepoContext,
  MarketRepoMetadata
> {
  private readonly indexer: IndexerDataSource;
  private readonly addresses: MarketRepoAddressConfig;
  private readonly grpc: GrpcDataSource;

  constructor({ indexer, addresses, grpc, ...params }: MarketRepoParams) {
    super(params);
    this.indexer = indexer;
    this.addresses = addresses;
    this.grpc = grpc;
  }

  get context() {
    return {
      ...this.baseContext,
      grpc: this.grpc,
      indexer: this.indexer,
      addresses: this.addresses,
    };
  }

  getMarkets({
    coinPrices,
    poolCoinNames,
    collateralCoinNames,
    source = 'api-first',
  }: MarketReadArgs & { source?: QuerySource }) {
    const options = {
      coinPrices,
      poolCoinNames,
      collateralCoinNames,
    };

    return runWithDataSourceFallback({
      source: source,
      label: 'MarketRepository.getMarkets',
      logger: this.logger,
      api: () => getMarketsFromIndexer(this.context, options),
      onchain: () => getMarketsFromOnChain(this.context, options),
    });
  }

  getMarket({
    coinPrice,
    coinName,
    source = 'api-first',
  }: {
    coinPrice: number;
    coinName: string;
    source?: QuerySource;
  }) {
    return runWithDataSourceFallback({
      source,
      label: 'MarketRepository.getMarketPool',
      logger: this.logger,
      api: () =>
        getMarketFromIndexer(this.context, {
          coinPrice,
          coinName,
        }),
      onchain: () =>
        getMarketFromOnChain(this.context, {
          coinPrice,
          coinName,
        }),
    });
  }

  /**
   * Supply limit of a lending pool (raw, decimals included). `'0'` when no
   * limit dynamic field is set.
   */
  getPoolSupplyLimit(poolName: string) {
    return getSupplyLimit(this.context, poolName);
  }

  /**
   * Borrow limit of a borrow pool (raw, decimals included). `'0'` when no
   * limit dynamic field is set.
   */
  getPoolBorrowLimit(poolName: string) {
    return getBorrowLimit(this.context, poolName);
  }

  getTvl({
    source = 'api-first',
    coinPrices,
  }: {
    source?: QuerySource;
    coinPrices: Record<string, number>;
  }) {
    return runWithDataSourceFallback({
      source,
      label: 'MarketRepository.getTvl',
      logger: this.logger,
      api: () => getTvlFromIndexer(this.context),
      onchain: () => getTvlFromOnChain(this.context, { coinPrices }),
    });
  }
}
