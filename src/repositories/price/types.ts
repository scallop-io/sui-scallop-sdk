import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoArgs } from '../types.js';
import { PriceServiceConnectionConfig } from '@pythnetwork/pyth-sui-js';

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
  pythPriceServiceConfig: PriceApiConfig;
};

export type PriceRepositoryArgs = BaseRepoArgs & {
  metadata: PriceRepositoryMetadata;
  pythPriceServiceConfig?: PriceApiConfig;
};
