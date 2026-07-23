import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { QueryClient } from '@tanstack/query-core';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache.js';
import { noopLogger } from 'src/logger/index.js';
import { ScallopQueryBaseParams } from 'src/models/scallopQuery/types.js';
import { BorrowIncentiveRepository } from '../borrowIncentive/index.js';
import { CoinBalanceRepository } from '../coinBalance/index.js';
import { FlashloanRepository } from '../flashloan/index.js';
import { IsolatedAssetsRepository } from '../isolatedAssets/index.js';
import { LoyaltyProgramRepository } from '../loyaltyProgram/index.js';
import { MarketRepository } from '../market/index.js';
import { ObligationRepository } from '../obligation/index.js';
import { PoolAddressesRepository } from '../poolAddresses/index.js';
import { PriceRepository } from '../price/index.js';
import { ReferralRepository } from '../referral/index.js';
import { SpoolRepository } from '../spool/index.js';
import { VeScaRepository } from '../veSca/index.js';
import { VeScaLoyaltyProgramRepository } from '../veScaLoyaltyProgram/index.js';
import { XOracleRepository } from '../xOracle/index.js';
import {
  createApiDataSource,
  createGraphQLDataSource,
  createGrpcDataSource,
  createIndexerDataSource,
  MAINNET_GRAPHQL_URL,
} from './datasources.js';
import {
  buildBorrowIncentiveMetadata,
  buildCoinBalanceMetadata,
  buildFlashloanMetadata,
  buildIsolatedAssetsMetadata,
  buildLoyaltyProgramMetadata,
  buildMarketAddresses,
  buildMarketMetadata,
  buildObligationMetadata,
  buildPoolAddressesMetadata,
  buildPriceMetadata,
  buildReferralMetadata,
  buildSpoolMetadata,
  buildVeScaLoyaltyProgramMetadata,
  buildVeScaMetadata,
  buildXOracleMetadata,
} from './metadata.js';
import { ScallopUtils } from 'src/models/index.js';

/**
 * Inputs the registry needs. `ScallopUtils` is the single hub — it exposes
 * `grpc`, `queryClient`, `logger`, `address`, and `constants`, so the
 * registry can derive every datasource + metadata bundle
 * from it.
 */
export type RepositoryDeps = {
  core: SuiGrpcClient;
  fullnodeUrl?: string;
  graphql: SuiGraphQLClient;
  graphqlUrl?: string;
  utils: ScallopUtils;
} & ScallopQueryBaseParams;

/**
 * The set of wired domain repositories. Every domain below is wired into the
 * facade — `ScallopQuery` delegates each read to `repos.<domain>`.
 */
export interface Repositories {
  readonly market: MarketRepository;
  readonly coinBalance: CoinBalanceRepository;
  readonly flashloan: FlashloanRepository;
  readonly obligation: ObligationRepository;
  readonly borrowIncentive: BorrowIncentiveRepository;
  readonly isolatedAssets: IsolatedAssetsRepository;
  readonly veSca: VeScaRepository;
  readonly loyaltyProgram: LoyaltyProgramRepository;
  readonly xOracle: XOracleRepository;
  readonly spool: SpoolRepository;
  readonly veScaLoyaltyProgram: VeScaLoyaltyProgramRepository;
  readonly referral: ReferralRepository;
  readonly price: PriceRepository;
  readonly poolAddresses: PoolAddressesRepository;
}

/**
 * Build the repository registry from the SDK models. Repos are constructed
 * lazily (on first access) and memoised, so unused domains cost nothing and
 * metadata is built at most once per domain.
 */
export const createRepositories = (deps: RepositoryDeps): Repositories => {
  const {
    core,
    fullnodeUrl,
    graphql,
    graphqlUrl,
    logger = noopLogger,
    indexerUrl,
    objectBatchWindowMs,
    priceTimeout,
    pythApiKey,
    pythEndpoints,
    queryClientConfig = DEFAULT_CACHE_OPTIONS,
    readTransport,
    tokensPerSecond,
    utils,
  } = deps;

  const indexer = createIndexerDataSource(indexerUrl);
  const queryClient: QueryClient =
    deps.queryClient ?? new QueryClient(queryClientConfig);
  const grpcSource = createGrpcDataSource(
    core,
    fullnodeUrl ?? getJsonRpcFullnodeUrl('mainnet'),
    {
      tokensPerSecond,
      objectBatchWindowMs,
    }
  );
  const base = { grpc: grpcSource, queryClient, logger };
  // Whether the heavy dynamic-field repos should prefer native nested GraphQL
  // queries (with gRPC fallback) over the Core multi-call fan-out. Only on when
  // the GraphQL read transport is selected.
  const preferGraphql = readTransport === 'graphql';
  // GraphQL-backed, self-caching datasource. Owns `multiGetBalances` (the gRPC
  // balance service flaps; GraphQL is stable) plus the Tier-2 native nested
  // queries used when `preferGraphql`. Pass an explicit client or url to
  // override; both default to mainnet.
  const graphqlSource = createGraphQLDataSource({
    client: graphql,
    url: graphqlUrl ?? MAINNET_GRAPHQL_URL,
    queryClient,
    logger,
    // Forward the caller's throughput cap so GraphQL balance reads are throttled
    // under the SAME policy as the gRPC transport. Omitted → both fall back
    // to the shared RateLimiter default (10/s).
    tokensPerSecond,
  });

  let market: MarketRepository | undefined;
  let coinBalance: CoinBalanceRepository | undefined;
  let flashloan: FlashloanRepository | undefined;
  let obligation: ObligationRepository | undefined;
  let borrowIncentive: BorrowIncentiveRepository | undefined;
  let isolatedAssets: IsolatedAssetsRepository | undefined;
  let veSca: VeScaRepository | undefined;
  let loyaltyProgram: LoyaltyProgramRepository | undefined;
  let xOracle: XOracleRepository | undefined;
  let spool: SpoolRepository | undefined;
  let veScaLoyaltyProgram: VeScaLoyaltyProgramRepository | undefined;
  let referral: ReferralRepository | undefined;
  let price: PriceRepository | undefined;
  let poolAddresses: PoolAddressesRepository | undefined;

  return {
    get market() {
      return (market ??= new MarketRepository({
        ...base,
        indexer,
        addresses: buildMarketAddresses(utils),
        metadata: buildMarketMetadata(utils),
      }));
    },
    get coinBalance() {
      return (coinBalance ??= new CoinBalanceRepository({
        ...base,
        balanceSource: graphqlSource,
        preferGraphql,
        metadata: buildCoinBalanceMetadata(utils),
      }));
    },
    get flashloan() {
      return (flashloan ??= new FlashloanRepository({
        ...base,
        graphql: graphqlSource,
        preferGraphql,
        metadata: buildFlashloanMetadata(utils),
      }));
    },
    get obligation() {
      return (obligation ??= new ObligationRepository({
        ...base,
        graphql: graphqlSource,
        preferGraphql,
        metadata: buildObligationMetadata(utils),
      }));
    },
    get borrowIncentive() {
      return (borrowIncentive ??= new BorrowIncentiveRepository({
        ...base,
        metadata: buildBorrowIncentiveMetadata(utils),
      }));
    },
    get isolatedAssets() {
      return (isolatedAssets ??= new IsolatedAssetsRepository({
        ...base,
        metadata: buildIsolatedAssetsMetadata(utils),
      }));
    },
    get veSca() {
      return (veSca ??= new VeScaRepository({
        ...base,
        preferGraphql,
        metadata: buildVeScaMetadata(utils),
      }));
    },
    get loyaltyProgram() {
      return (loyaltyProgram ??= new LoyaltyProgramRepository({
        ...base,
        metadata: buildLoyaltyProgramMetadata(utils),
      }));
    },
    get xOracle() {
      return (xOracle ??= new XOracleRepository({
        ...base,
        metadata: buildXOracleMetadata(utils),
      }));
    },
    get spool() {
      return (spool ??= new SpoolRepository({
        ...base,
        indexer,
        metadata: buildSpoolMetadata(utils),
      }));
    },
    get veScaLoyaltyProgram() {
      return (veScaLoyaltyProgram ??= new VeScaLoyaltyProgramRepository({
        ...base,
        metadata: buildVeScaLoyaltyProgramMetadata(utils),
      }));
    },
    get referral() {
      return (referral ??= new ReferralRepository({
        ...base,
        metadata: buildReferralMetadata(utils),
      }));
    },
    get price() {
      return (price ??= new PriceRepository({
        ...base,
        indexer,
        metadata: buildPriceMetadata(utils),
        priceTimeout,
        pythApiKey,
        pythEndpoints,
      }));
    },
    get poolAddresses() {
      return (poolAddresses ??= new PoolAddressesRepository({
        ...base,
        api: createApiDataSource(),
        graphql: graphqlSource,
        preferGraphql,
        metadata: buildPoolAddressesMetadata(utils),
      }));
    },
  };
};
