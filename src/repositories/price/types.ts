import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoParams } from '../types.js';
import { IndexerDataSource } from 'src/datasources/indexer.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { HermesClientConfig } from '@pythnetwork/pyth-sui-js';

// Derived from the canonical `core.coins` value shape (single source of truth for
// the per-coin oracle/treasury config). Kept as a dense `Record` (the schema's is
// `Partial`) via `NonNullable`, preserving the repo's "coin is present" contract.
export type CoinsAddresses = {
  coins: Record<
    string,
    NonNullable<AddressesInterface['core']['coins'][string]>
  >;
};

export type PriceRepositoryMetadata = {
  addresses: CoinsAddresses;
  pythApiKey?: string;
};

export type PriceApiConfig = {
  endpoint: string;
  config: HermesClientConfig;
};

export type PriceRepositoryContext = BaseContext & {
  metadata: PriceRepositoryMetadata;
  grpc: GrpcDataSource;
  indexer: IndexerDataSource;
  pythPriceServiceConfig: PriceApiConfig;
  /** Cache lifetime (ms) for the full Pyth price-feed list. */
  priceTimeout: number;
  /**
   * Pyth API access token. When set, Pyth prices are read directly from the
   * Pyth (Hermes) API; otherwise they come from the Scallop indexer.
   */
  pythApiKey?: string;
};

export type PriceRepositoryParams = BaseRepoParams & {
  grpc: GrpcDataSource;
  indexer: IndexerDataSource;
  metadata: PriceRepositoryMetadata;
  pythPriceServiceConfig?: PriceApiConfig;
  /** Cache lifetime (ms) for the full Pyth price-feed list. Defaults to 5_000. */
  priceTimeout?: number;
  /**
   * Pyth API access token. When set, Pyth prices are read directly from the
   * Pyth (Hermes) API; otherwise they come from the Scallop indexer.
   */
  pythApiKey?: string;
  /**
   * @deprecated Use pythEndpoint instead
   * Pyth (Hermes) endpoints. The first is used as the default price-read
   * endpoint when no explicit `pythPriceServiceConfig` is supplied.
   */
  pythEndpoints?: string[];
  pythEndpoint?: string;
};

/** Minimal context for the Pyth API price read. */
export type PriceApiContext = Pick<
  PriceRepositoryContext,
  | 'indexer'
  | 'fetchWithCache'
  | 'metadata'
  | 'pythPriceServiceConfig'
  | 'priceTimeout'
  | 'logger'
  | 'pythApiKey'
>;

/** Minimal context for the on-chain Pyth feed-object price read. */
export type PriceOnChainContext = Pick<
  PriceRepositoryContext,
  'grpc' | 'fetchWithCache' | 'metadata' | 'logger'
>;

/** Minimal context for the indexer coin-price read. */
export type PriceIndexerContext = Pick<
  PriceRepositoryContext,
  'indexer' | 'fetchWithCache'
>;
