/**
 * Pyth prices
 * indexer coin prices
 * all coin prices
 * price update policies
 * asset oracle config
 * switchboard aggregator ids
 */

import { IndexerDataSource } from 'src/datasources/indexer.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { BaseRepository } from '../base.js';
import { QuerySource, runWithDataSourceFallback } from '../utils.js';
import {
  DEFAULT_PRICE_TIMEOUT,
  DEFAULT_PYTH_URL,
  LEGACY_PYTH_HERMES_ENDPOINT,
} from './const.js';
import {
  getCoingeckoPrices,
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
  private readonly grpc: GrpcDataSource;
  private readonly priceTimeout: number;
  private readonly pythApiKey?: string;
  private readonly pythEndpoint: string;

  constructor({
    pythPriceServiceConfig,
    indexer,
    grpc,
    priceTimeout,
    pythApiKey,
    pythEndpoints,
    pythEndpoint = pythEndpoints?.[0] ?? DEFAULT_PYTH_URL,
    ...params
  }: PriceRepositoryParams) {
    super(params);
    this.pythApiKey = pythApiKey;
    this.pythEndpoint = pythEndpoint;
    // Default the price-read endpoint to the builder's first configured
    // `pythEndpoints` entry, falling back to DEFAULT_PYTH_URL. An explicit
    // `pythPriceServiceConfig` still takes precedence over both.
    const config = pythPriceServiceConfig ?? {
      endpoint: this.pythEndpoint,
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
    this.grpc = grpc;
    this.priceTimeout = priceTimeout ?? DEFAULT_PRICE_TIMEOUT;
  }

  /** The indexer datasource, exposed for the pyth oracle rule's keyless path. */
  get indexerDataSource(): IndexerDataSource {
    return this.indexer;
  }

  get context() {
    return {
      ...this.baseContext,
      grpc: this.grpc,
      indexer: this.indexer,
      pythPriceServiceConfig: this.config,
      priceTimeout: this.priceTimeout,
      pythApiKey: this.pythApiKey,
    };
  }

  /**
   * Oracle prices for the given coins.
   *
   * @description
   * Despite the name, this is the ORACLE price read, not a pyth-only one: coins
   * whose xOracle rule routes away from pyth (SCA -> custom oracle) are split
   * out and priced from their own source (CoinGecko via the indexer), because
   * their `core.coins.*.oracle.pyth` feed is stale. The two halves are fetched
   * concurrently and merged.
   */
  async getPricesFromPyth({
    coinNames,
    source = 'api-first',
  }: {
    coinNames: string[];
    source?: QuerySource;
  }) {
    const { nonPythCoinNames } = this.metadata;
    const pythCoinNames = coinNames.filter(
      (coinName) => !nonPythCoinNames.has(coinName)
    );
    const nonPyth = coinNames.filter((coinName) =>
      nonPythCoinNames.has(coinName)
    );

    const empty: Record<string, number> = {};
    const [pythPrices, nonPythPrices] = await Promise.all([
      pythCoinNames.length === 0
        ? empty
        : runWithDataSourceFallback({
            source,
            label: 'PriceRepository.getPriceFromPyth',
            logger: this.logger,
            api: () => this.getPricesFromApi(pythCoinNames),
            onchain: () =>
              getPythPricesFromOnChain(this.context, pythCoinNames),
          }),
      nonPyth.length === 0 ? empty : getCoingeckoPrices(this.context, nonPyth),
    ]);
    return { ...pythPrices, ...nonPythPrices };
  }

  /**
   * API price read with a per-coin on-chain fallback: read from Pyth directly
   * (when an API key is set) or the Scallop indexer, then re-fetch any coin the
   * API returned as `0` (missing) from its on-chain feed object. The on-chain
   * enrichment is best-effort — if it fails, the API result (with `0`s) stands.
   */
  private async getPricesFromApi(coinNames: string[]) {
    const prices =
      this.pythEndpoint === LEGACY_PYTH_HERMES_ENDPOINT || !!this.pythApiKey
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

  /**
   * Indexer (markets payload) prices for the given coins.
   *
   * @description
   * The markets payload prices coins routed off pyth (SCA) from the on-chain
   * oracle value, which is not the price we use for them. Those coins are
   * overridden with their CoinGecko price, same as `getPricesFromPyth`. If the
   * CoinGecko read fails (0), the indexer value is kept.
   */
  async getPricesFromIndexer({ coinNames }: { coinNames: string[] }) {
    const nonPyth = coinNames.filter((coinName) =>
      this.metadata.nonPythCoinNames.has(coinName)
    );
    const [prices, coingeckoPrices] = await Promise.all([
      getPricesFromIndexer(this.context, { coinNames }),
      nonPyth.length === 0
        ? ({} as Record<string, number>)
        : getCoingeckoPrices(this.context, nonPyth),
    ]);
    for (const coinName of nonPyth) {
      if (coingeckoPrices[coinName])
        prices[coinName] = coingeckoPrices[coinName];
    }
    return prices;
  }
}
