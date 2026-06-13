import { getAllCoinPrices as getAllCoinPricesFn } from 'src/queries/priceQuery.js';
import type { CoinPrices, MarketPools, OptionalKeys } from 'src/types/index.js';
import type { Logger } from 'src/logger/index.js';
import type ScallopQuery from 'src/models/scallopQuery.js';
import type ScallopIndexer from 'src/models/scallopIndexer.js';
import type ScallopUtils from 'src/models/scallopUtils.js';

export type AllCoinPricesOptions = {
  marketPools?: MarketPools;
  coinPrices?: CoinPrices;
  indexer?: boolean;
};

export interface PriceServiceParams {
  query: ScallopQuery;
  indexer?: ScallopIndexer;
  utils?: ScallopUtils;
  logger?: Logger;
}

/**
 * Read-side price aggregation.
 *
 * Wraps the three current price sources:
 *  - `ScallopUtils.getPythPrice(s)` — pyth fee object (default RPC path).
 *  - `ScallopIndexer.getCoinPrice(s)` — Scallop indexer.
 *  - `getAllCoinPrices` free function — combines coin prices with sCoin
 *    prices via the conversion rate from market pools.
 *
 * The free function still owns the indexer/RPC branching internally (its
 * `indexer: boolean` arg), so this service doesn't currently use
 * `runWithSourceFallback`. The service exists to give callers a single
 * stable entry point and to centralise the dependency wiring; the
 * `logger` is plumbed but unused today, reserved for future fallback /
 * error reporting.
 */
export class PriceService {
  private readonly query: ScallopQuery;
  private readonly indexer: ScallopIndexer;
  private readonly utils: ScallopUtils;
  // Kept for future fallback/error-reporting; intentionally unused today.
  protected readonly logger?: Logger;

  constructor(params: PriceServiceParams) {
    this.query = params.query;
    this.indexer = params.indexer ?? params.query.indexer;
    this.utils = params.utils ?? params.query.utils;
    this.logger = params.logger ?? params.query.utils.logger;
  }

  getPriceFromPyth(assetCoinName: string): Promise<number> {
    return this.utils.getPythPrice(assetCoinName);
  }

  getPricesFromPyth(assetCoinNames: string[]) {
    return this.utils.getPythPrices(assetCoinNames);
  }

  getCoinPriceByIndexer(poolName: string) {
    return this.indexer.getCoinPrice(poolName);
  }

  getCoinPricesByIndexer() {
    return this.indexer.getCoinPrices();
  }

  getAllCoinPrices(
    options?: AllCoinPricesOptions
  ): Promise<OptionalKeys<Record<string, number>>> {
    return getAllCoinPricesFn(
      this.query,
      options?.marketPools,
      options?.coinPrices,
      options?.indexer
    );
  }
}
