import {
  resolveQuerySource,
  runWithSourceFallback,
  type QueryOptions,
} from 'src/utils/index.js';
import {
  getLending as getLendingFn,
  getLendings as getLendingsFn,
} from 'src/queries/portfolioQuery.js';
import type { CoinPrices, MarketPools } from 'src/types/index.js';
import type { Logger } from 'src/logger/index.js';
import type ScallopQuery from 'src/models/scallopQuery.js';

export type LendingsOptions = QueryOptions & {
  marketPools?: MarketPools;
  coinPrices?: CoinPrices;
};

export interface LendingReadServiceParams {
  query: ScallopQuery;
  logger?: Logger;
}

/**
 * Centralises source selection + fallback for the read-side lending API.
 *
 * Same pattern as `MarketService` / `ObligationService` / `SpoolReadService`
 * / `BorrowIncentiveService`: free functions in `src/queries/portfolioQuery.ts`
 * are invoked directly with `indexer=true|false`, bypassing
 * `ScallopQuery.getLending(s)` so the round-trip doesn't recurse.
 *
 * Named `LendingReadService` to disambiguate from the write-side
 * `src/services/client/LendingService.ts` (which builds supply / withdraw /
 * flash-loan transactions).
 */
export class LendingReadService {
  private readonly query: ScallopQuery;
  private readonly logger?: Logger;

  constructor(params: LendingReadServiceParams) {
    this.query = params.query;
    this.logger = params.logger ?? params.query.utils.logger;
  }

  async getLendings(
    poolCoinNames: string[] | undefined,
    ownerAddress: string,
    options?: LendingsOptions
  ) {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'LendingReadService.getLendings',
      logger: this.logger,
      indexer: () =>
        getLendingsFn(
          this.query,
          poolCoinNames,
          ownerAddress,
          options?.marketPools,
          options?.coinPrices,
          true
        ),
      rpc: () =>
        getLendingsFn(
          this.query,
          poolCoinNames,
          ownerAddress,
          options?.marketPools,
          options?.coinPrices,
          false
        ),
    });
  }

  async getLending(
    poolCoinName: string,
    ownerAddress: string,
    options?: QueryOptions
  ) {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'LendingReadService.getLending',
      logger: this.logger,
      indexer: () => getLendingFn(this.query, poolCoinName, ownerAddress, true),
      rpc: () => getLendingFn(this.query, poolCoinName, ownerAddress, false),
    });
  }
}
