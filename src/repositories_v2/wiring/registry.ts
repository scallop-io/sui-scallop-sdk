import type ScallopUtils from 'src/models/scallopUtils.js';
import type { QueryClient } from '@tanstack/query-core';
import type { Logger } from 'src/logger/index.js';
import {
  createIndexerDataSource,
  createOnChainDataSource,
} from './datasources.js';
import {
  buildBorrowIncentiveAddresses,
  buildBorrowIncentiveMetadata,
  buildCoinBalanceMetadata,
  buildFlashloanMetadata,
  buildIsolatedAssetsMetadata,
  buildLoyaltyProgramMetadata,
  buildMarketAddresses,
  buildMarketMetadata,
  buildObligationMetadata,
  buildSpoolMetadata,
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

/**
 * Inputs the registry needs. `ScallopUtils` is the single hub — it exposes
 * `scallopSuiKit`, `queryClient`, `logger`, `address`, and `constants`, so the
 * registry can derive every datasource + metadata bundle from it.
 */
export type RepositoryDeps = {
  utils: ScallopUtils;
  /** Override the indexer base URL; defaults to the Scallop indexer. */
  indexerUrl?: string;
};

/**
 * The set of wired domain repositories. This interface GROWS as each domain is
 * migrated off the old query/service layer (see root PLAN.md Phase 2). Today:
 * market, coinBalance, flashloan.
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
}

/**
 * Build the repository registry from the SDK models. Repos are constructed
 * lazily (on first access) and memoised, so unused domains cost nothing and
 * metadata is built at most once per domain.
 */
export const createRepositories = (deps: RepositoryDeps): Repositories => {
  const { utils, indexerUrl } = deps;

  const onchain = createOnChainDataSource(utils.scallopSuiKit);
  const indexer = createIndexerDataSource(indexerUrl);
  const queryClient: QueryClient = utils.queryClient;
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
        addresses: buildBorrowIncentiveAddresses(utils),
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
  };
};
