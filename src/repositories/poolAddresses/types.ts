import { ApiDataSource } from 'src/datasources/api.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { GraphQLDataSource } from 'src/datasources/graphql/index.js';
import { BaseContext, BaseRepoParams } from '../types.js';
import { AddressesInterface } from 'src/types/address.js';

type PoolAddressesAddresses = {
  core: Pick<AddressesInterface['core'], 'coins' | 'market'>;
  spool: Pick<AddressesInterface['spool'], 'pools'>;
  scoin: Pick<AddressesInterface['scoin'], 'coins'>;
};

export type PoolAddressesRepoMetadata = {
  addresses: PoolAddressesAddresses;
};

export type PoolAddressesRepoParams = BaseRepoParams & {
  metadata: PoolAddressesRepoMetadata;
  api: ApiDataSource;
  grpc: GrpcDataSource;
  /** GraphQL source for the Tier-2 native rebuild. Present only when wired. */
  graphql?: GraphQLDataSource;
  /** Prefer the native GraphQL rebuild (with on-chain fallback) when true. */
  preferGraphql?: boolean;
};

export type PoolAddressesRepoContext = BaseContext & {
  metadata: PoolAddressesRepoMetadata;
  api: ApiDataSource;
  grpc: GrpcDataSource;
  graphql?: GraphQLDataSource;
  preferGraphql?: boolean;
};

/** Minimal context for the API-sourced pool-addresses read. */
export type PoolAddressesApiContext = Pick<
  PoolAddressesRepoContext,
  'api' | 'fetchWithCache'
>;

/** Minimal context for the on-chain pool-addresses rebuild. */
export type PoolAddressesOnChainContext = Pick<
  PoolAddressesRepoContext,
  'grpc' | 'fetchWithCache' | 'metadata' | 'logger'
>;

/**
 * Context for the native GraphQL rebuild — the on-chain context (it still reads
 * the market object via `grpc.getObject`, transport-agnostic) plus a
 * required `graphql` source for the dynamic-field scans.
 */
export type PoolAddressesGraphQLContext = PoolAddressesOnChainContext & {
  graphql: GraphQLDataSource;
};

export type PoolAddress = {
  coinName: string;
  symbol: string;
  coinType: string;
  coinMetadataId: string;
  decimals: number;
  isIsolated: boolean;
  // optional keys
  pythFeed?: string;
  pythFeedObjectId?: string;
  lendingPoolAddress?: string;
  borrowDynamic?: string;
  interestModel?: string;
  borrowFeeKey?: string;
  flashloanFeeObject?: string;
  coinGeckoId?: string;
  collateralPoolAddress?: string; // not all pool has collateral
  riskModel?: string;
  supplyLimitKey?: string;
  borrowLimitKey?: string;
  sCoinType?: string;
  sCoinName?: string;
  sCoinSymbol?: string;
  sCoinMetadataId?: string;
  sCoinTreasury?: string;
  isolatedAssetKey: string;
  spool?: string;
  spoolReward?: string;
  spoolName?: string;
};
