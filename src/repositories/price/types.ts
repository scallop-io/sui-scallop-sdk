import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoArgs } from '../types.js';
import { PriceServiceConnectionConfig } from '@pythnetwork/pyth-sui-js';
import { IndexerDataSource } from 'src/datasources/indexer.js';

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
};

export type PriceApiConfig = {
  endpoint: string;
  config: PriceServiceConnectionConfig;
};

export type PriceRepositoryContext = BaseContext & {
  metadata: PriceRepositoryMetadata;
  indexer: IndexerDataSource;
  pythPriceServiceConfig: PriceApiConfig;
};

export type PriceRepositoryArgs = BaseRepoArgs & {
  indexer: IndexerDataSource;
  metadata: PriceRepositoryMetadata;
  pythPriceServiceConfig?: PriceApiConfig;
};

/** Minimal context for the Pyth API price read. */
export type PriceApiContext = Pick<
  PriceRepositoryContext,
  'fetchWithCache' | 'metadata' | 'pythPriceServiceConfig' | 'logger'
>;

/** Minimal context for the on-chain Pyth feed-object price read. */
export type PriceOnChainContext = Pick<
  PriceRepositoryContext,
  'onchain' | 'fetchWithCache' | 'metadata' | 'logger'
>;

/** Minimal context for the indexer coin-price read. */
export type PriceIndexerContext = Pick<
  PriceRepositoryContext,
  'indexer' | 'fetchWithCache'
>;
