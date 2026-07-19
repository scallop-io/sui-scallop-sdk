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
import { DEFAULT_PRICE_TIMEOUT, DEFAULT_PYTH_URL } from './const.js';
import {
  getPricesFromIndexer,
  getPythFeedObjectFromOnChain,
  getPythFeedObjectsFromOnChain,
  getPythPricesFromPythApi,
  getPythPricesFromIndexerApi,
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
  private readonly priceTimeout: number;
  private readonly pythApiKey?: string;

  constructor({
    pythPriceServiceConfig,
    indexer,
    onchain,
    priceTimeout,
    pythApiKey,
    pythEndpoints,
    ...params
  }: PriceRepositoryParams) {
    super(params);
    this.pythApiKey = pythApiKey;
    // Default the price-read endpoint to the builder's first configured
    // `pythEndpoints` entry, falling back to DEFAULT_PYTH_URL. An explicit
    // `pythPriceServiceConfig` still takes precedence over both.
    const config = pythPriceServiceConfig ?? {
      endpoint: pythEndpoints?.[0] ?? DEFAULT_PYTH_URL,
      config: {
        timeout: 4_000,
        httpRetries: 1,
      },
    };
    // Authenticate direct Pyth (Hermes) reads with the access token when given.
    this.config = pythApiKey
      ? { ...config, config: { ...config.config, accessToken: pythApiKey } }
      : config;
    this.indexer = indexer;
    this.onchain = onchain;
    this.priceTimeout = priceTimeout ?? DEFAULT_PRICE_TIMEOUT;
  }

  /** The indexer datasource, exposed for the pyth oracle rule's keyless path. */
  get indexerDataSource(): IndexerDataSource {
    return this.indexer;
  }

  get context() {
    return {
      ...this.baseContext,
      onchain: this.onchain,
      indexer: this.indexer,
      pythPriceServiceConfig: this.config,
      priceTimeout: this.priceTimeout,
      pythApiKey: this.pythApiKey,
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
      api: () => this.getPricesFromApi(coinNames),
      onchain: () => getPythPricesFromOnChain(this.context, coinNames),
    });
  }

  /**
   * API price read with a per-coin on-chain fallback: read from Pyth directly
   * (when an API key is set) or the Scallop indexer, then re-fetch any coin the
   * API returned as `0` (missing) from its on-chain feed object. The on-chain
   * enrichment is best-effort — if it fails, the API result (with `0`s) stands.
   */
  private async getPricesFromApi(coinNames: string[]) {
    const prices = this.pythApiKey
      ? await getPythPricesFromPythApi(this.context, coinNames)
      : await getPythPricesFromIndexerApi(this.context, coinNames);

    const missing = coinNames.filter((coinName) => !prices[coinName]);
    if (missing.length === 0) return prices;

    try {
      const onChainPrices = await getPythPricesFromOnChain(
        this.context,
        missing
      );
      for (const coinName of missing) {
        if (onChainPrices[coinName]) prices[coinName] = onChainPrices[coinName];
      }
    } catch (e) {
      this.logger.warn('on-chain fallback for missing pyth prices failed', {
        missing,
        message: (e as Error)?.message,
      });
    }
    return prices;
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
