/**
 * Pyth prices
 * indexer coin prices
 * all coin prices
 * price update policies
 * asset oracle config
 * switchboard aggregator ids
 */

import { IndexerDataSource } from 'src/datasources/indexer.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { BaseRepository } from '../base.js';
import { QuerySource, runWithDataSourceFallback } from '../utils.js';
import { DEFAULT_PYTH_URL } from './const.js';
import {
  getPricesFromIndexer,
  getPythFeedObjectFromOnChain,
  getPythFeedObjectsFromOnChain,
  getPythPricesFromApi,
  getPythPricesFromOnChain,
} from './helpers.js';
import {
  PriceApiConfig,
  PriceRepositoryParams,
  PriceRepositoryContext,
  PriceRepositoryMetadata,
} from './types.js';

export class PriceRepository extends BaseRepository<
  PriceRepositoryContext,
  PriceRepositoryMetadata
> {
  private readonly config: PriceApiConfig;
  private readonly indexer: IndexerDataSource;
  private readonly onchain: OnChainDataSource;

  constructor({
    pythPriceServiceConfig,
    indexer,
    onchain,
    ...params
  }: PriceRepositoryParams) {
    super(params);
    this.config = pythPriceServiceConfig ?? {
      endpoint: DEFAULT_PYTH_URL,
      config: {
        timeout: 4_000,
        httpRetries: 1,
      },
    };
    this.indexer = indexer;
    this.onchain = onchain;
  }

  get context() {
    return {
      ...this.baseContext,
      onchain: this.onchain,
      indexer: this.indexer,
      pythPriceServiceConfig: this.config,
    };
  }

  getPricesFromPyth({
    coinNames,
    source = 'api-first',
  }: {
    coinNames: string[];
    source?: QuerySource;
  }) {
    return runWithDataSourceFallback({
      source,
      label: 'PriceRepository.getPriceFromPyth',
      logger: this.logger,
      api: () => getPythPricesFromApi(this.context, coinNames),
      onchain: () => getPythPricesFromOnChain(this.context, coinNames),
    });
  }

  getPythFeedObject(feedObjectId: string) {
    return getPythFeedObjectFromOnChain(this.context, feedObjectId);
  }

  getPythFeedObjects(feedObjectIds: string[]) {
    return getPythFeedObjectsFromOnChain(this.context, feedObjectIds);
  }

  getPricesFromIndexer(args: { coinNames: string[] }) {
    return getPricesFromIndexer(this.context, args);
  }
}
