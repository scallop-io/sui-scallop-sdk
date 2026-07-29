import type ScallopUtils from 'src/models/scallopUtils/index.js';
import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import type { Logger } from 'src/logger/index.js';
import { createApiDataSource, createIndexerDataSource } from './datasources.js';
import {
  buildBorrowIncentiveMetadata,
  buildReferralMetadata,
  buildPriceMetadata,
  buildPoolAddressesMetadata,
  buildCoinBalanceMetadata,
  buildFlashloanMetadata,
  buildIsolatedAssetsMetadata,
  buildLoyaltyProgramMetadata,
  buildMarketAddresses,
  buildMarketMetadata,
  buildObligationMetadata,
  buildSpoolMetadata,
  buildVeScaLoyaltyProgramMetadata,
  buildVeScaMetadata,
  buildXOracleMetadata,
} from './metadata.js';
import { MarketRepository } from '../market/index.js';
import { CoinBalanceRepository } from '../coinBalance/index.js';
import { FlashloanRepository } from '../flashloan/index.js';
import { ObligationRepository } from '../obligation/index.js';
import { BorrowIncentiveRepository } from '../borrowIncentive/index.js';
import { IsolatedAssetsRepository } from '../isolatedAssets/index.js';
import { VeScaRepository } from '../veSca/index.js';
import { LoyaltyProgramRepository } from '../loyaltyProgram/index.js';
import { XOracleRepository } from '../xOracle/index.js';
import { SpoolRepository } from '../spool/index.js';
import { VeScaLoyaltyProgramRepository } from '../veScaLoyaltyProgram/index.js';
import { ReferralRepository } from '../referral/index.js';
import { PoolAddressesRepository } from '../poolAddresses/index.js';
import { PriceRepository } from '../price/index.js';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache.js';

/**
 * Inputs the registry needs. `ScallopUtils` is the single hub — it exposes
 * `onchain`, `queryClient`, `logger`, `address`, and `constants`, so the
 * registry can derive every datasource + metadata bundle
 * from it.
 */
export type RepositoryDeps = {
  utils: ScallopUtils;
  queryClient?: QueryClient; // Optional override for the utils query client
  queryClientConfig?: QueryClientConfig; // Optional override for the utils query client config
  /** Override the indexer base URL; defaults to the Scallop indexer. */
  indexerUrl?: string;
};

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
  const { utils, indexerUrl, queryClientConfig = DEFAULT_CACHE_OPTIONS } = deps;

  const onchain = utils.onchain;
  const indexer = createIndexerDataSource(indexerUrl);
  const queryClient: QueryClient =
    deps.queryClient ?? new QueryClient(queryClientConfig);
  const logger: Logger = utils.logger;
  const base = { onchain, queryClient, logger };

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
        metadata: buildCoinBalanceMetadata(utils),
      }));
    },
    get flashloan() {
      return (flashloan ??= new FlashloanRepository({
        ...base,
        metadata: buildFlashloanMetadata(utils),
      }));
    },
    get obligation() {
      return (obligation ??= new ObligationRepository({
        ...base,
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
      }));
    },
    get poolAddresses() {
      return (poolAddresses ??= new PoolAddressesRepository({
        ...base,
        api: createApiDataSource(),
        metadata: buildPoolAddressesMetadata(utils),
      }));
    },
  };
};
