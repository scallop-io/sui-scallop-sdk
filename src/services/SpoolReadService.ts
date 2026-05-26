import {
  resolveQuerySource,
  runWithSourceFallback,
  type QueryOptions,
} from 'src/utils/index.js';
import {
  getSpools as getSpoolsFn,
  getSpool as getSpoolFn,
} from 'src/queries/spoolQuery.js';
import type { CoinPrices, MarketPools, Spool } from 'src/types/index.js';
import type { Logger } from 'src/logger/index.js';
import type ScallopQuery from 'src/models/scallopQuery.js';

export type SpoolsServiceOptions = QueryOptions & {
  marketPools?: MarketPools;
  coinPrices?: CoinPrices;
};

export interface SpoolReadServiceParams {
  query: ScallopQuery;
  logger?: Logger;
}

/**
 * Centralises source selection + fallback for the read-side spool API.
 *
 * Mirrors `MarketService` / `ObligationService`: the RPC path calls the
 * underlying free functions in `src/queries/spoolQuery.ts` with
 * `indexer=false`; the indexer path passes `indexer=true` (the free function
 * dispatches to `query.indexer.getSpools` internally). Calling the free
 * functions directly avoids the `ScallopQuery → service → ScallopQuery`
 * recursion that would otherwise occur once `ScallopQuery` delegates here.
 *
 * Named `SpoolReadService` to disambiguate from the write-side
 * `src/services/client/SpoolService.ts` (which builds spool transactions).
 */
export class SpoolReadService {
  private readonly query: ScallopQuery;
  private readonly logger?: Logger;

  constructor(params: SpoolReadServiceParams) {
    this.query = params.query;
    this.logger = params.logger ?? params.query.utils.logger;
  }

  async getSpools(
    stakeMarketCoinNames?: string[],
    options?: SpoolsServiceOptions
  ) {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'SpoolReadService.getSpools',
      logger: this.logger,
      indexer: () =>
        getSpoolsFn(
          this.query,
          stakeMarketCoinNames,
          true,
          options?.marketPools,
          options?.coinPrices
        ),
      rpc: () =>
        getSpoolsFn(
          this.query,
          stakeMarketCoinNames,
          false,
          options?.marketPools,
          options?.coinPrices
        ),
    });
  }

  async getSpool(
    stakeMarketCoinName: string,
    options?: SpoolsServiceOptions
  ): Promise<Spool | undefined> {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'SpoolReadService.getSpool',
      logger: this.logger,
      indexer: () =>
        getSpoolFn(this.query, stakeMarketCoinName, true, options?.coinPrices),
      rpc: () =>
        getSpoolFn(this.query, stakeMarketCoinName, false, options?.coinPrices),
    });
  }
}
