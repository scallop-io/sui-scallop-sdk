/**
 * pools
 * collaterals
 * pool addresses
 * supply/borrow limits
 * isolated assets
 * market object reads
 */

import { IndexerDataSource } from 'src/datasources/indexer.js';
import {
  QuerySource,
  runWithDataSourceFallback,
} from 'src/repositories_v2/util.js';
import { BaseRepository } from '../base.js';
import {
  getMarketFromIndexer,
  getMarketFromOnChain,
  getMarketsFromIndexer,
  getMarketsFromOnChain,
} from './helpers.js';
import {
  MarketReadArgs,
  MarketRepoAddressConfig,
  MarketRepoArgs,
  MarketRepoContext,
  MarketRepoMetadata,
} from './types.js';

export class MarketRepository extends BaseRepository<
  MarketRepoContext,
  MarketRepoMetadata
> {
  private readonly indexer: IndexerDataSource;
  private readonly addresses: MarketRepoAddressConfig;
  declare protected readonly metadata: MarketRepoMetadata;

  constructor({ indexer, addresses, ...args }: MarketRepoArgs) {
    super(args);
    this.indexer = indexer;
    this.addresses = addresses;
  }

  get context() {
    return {
      ...this.baseContext,
      indexer: this.indexer,
      addresses: this.addresses,
      metadata: this.metadata,
    };
  }

  getMarkets({
    coinPrices,
    source = 'api-first',
  }: MarketReadArgs & { source?: QuerySource }) {
    const options = {
      coinPrices,
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

  // /**
  //  * Get swap rate from sCoin A to sCoin B.
  //  */
  // getSCoinSwapRate({
  //   fromSCoin,
  //   toSCoin,
  //   coinPrices,
  //   source,
  // }: {
  //   fromSCoin: string;
  //   toSCoin: string;
  //   coinPrices: Record<string, number>;
  //   source?: QuerySource;
  // }) {
  //   return runWithDataSourceFallback({
  //     source,
  //     label: 'MarketRepository.getSCoinSwapRate',
  //     api: () =>
  //       getSCoinSwapRateFromIndexer(this.baseHelperArgs, {
  //         fromSCoin,
  //         toSCoin,
  //         coinPrices,
  //       }),
  //     onchain: () =>
  //       getSCoinSwapRateFromOnChain(this.baseHelperArgs, {
  //         fromSCoin,
  //         toSCoin,
  //         coinPrices,
  //       }),
  //   });
  // }
}
