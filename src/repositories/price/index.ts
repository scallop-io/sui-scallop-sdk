/**
 * Pyth prices
 * indexer coin prices
 * all coin prices
 * price update policies
 * asset oracle config
 * switchboard aggregator ids
 */

import { IndexerDataSource } from 'src/datasources/indexer.js';
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
  PriceRepositoryArgs,
  PriceRepositoryContext,
  PriceRepositoryMetadata,
} from './types.js';

export class PriceRepository extends BaseRepository<
  PriceRepositoryContext,
  PriceRepositoryMetadata
> {
  private readonly config: PriceApiConfig;
  private readonly indexer: IndexerDataSource;

  constructor({
    pythPriceServiceConfig,
    indexer,
    ...args
  }: PriceRepositoryArgs) {
    super(args);
    this.config = pythPriceServiceConfig ?? {
      endpoint: DEFAULT_PYTH_URL,
      config: {
        timeout: 4_000,
        httpRetries: 1,
      },
    };
    this.indexer = indexer;
  }

  get context() {
    return {
      ...this.baseContext,
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
