import {
  resolveQuerySource,
  runWithSourceFallback,
  type QueryOptions,
} from 'src/utils/index.js';
import { getBorrowIncentivePools as getBorrowIncentivePoolsFn } from 'src/queries/borrowIncentiveQuery.js';
import type { CoinPrices, MarketPools } from 'src/types/index.js';
import type { Logger } from 'src/logger/index.js';
import type ScallopQuery from 'src/models/scallopQuery.js';

export type BorrowIncentivePoolsOptions = QueryOptions & {
  coinPrices?: CoinPrices;
  marketPools?: MarketPools;
};

export interface BorrowIncentiveServiceParams {
  query: ScallopQuery;
  logger?: Logger;
}

/**
 * Centralises source selection + fallback for the read-side borrow-incentive
 * pools API. Same pattern as `MarketService` / `ObligationService`: free
 * function in `src/queries/borrowIncentiveQuery.ts` is invoked directly with
 * `indexer=true|false`, bypassing `ScallopQuery.getBorrowIncentivePools` so
 * the round-trip from `ScallopQuery` → service → `ScallopQuery` doesn't
 * recurse.
 */
export class BorrowIncentiveService {
  private readonly query: ScallopQuery;
  private readonly logger?: Logger;

  constructor(params: BorrowIncentiveServiceParams) {
    this.query = params.query;
    this.logger = params.logger ?? params.query.utils.logger;
  }

  async getBorrowIncentivePools(
    coinNames?: string[],
    options?: BorrowIncentivePoolsOptions
  ) {
    const source = resolveQuerySource(options);
    const names = coinNames ?? [...this.query.constants.whitelist.lending];
    return runWithSourceFallback({
      source,
      label: 'BorrowIncentiveService.getBorrowIncentivePools',
      logger: this.logger,
      indexer: () =>
        getBorrowIncentivePoolsFn(
          this.query,
          names,
          true,
          options?.marketPools,
          options?.coinPrices
        ),
      rpc: () =>
        getBorrowIncentivePoolsFn(
          this.query,
          names,
          false,
          options?.marketPools,
          options?.coinPrices
        ),
    });
  }
}
