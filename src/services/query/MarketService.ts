import {
  resolveQuerySource,
  runWithSourceFallback,
  type QueryOptions,
} from 'src/utils/index.js';
import { createIndexerMarketRepository } from 'src/repositories/indexerMarketRepository.js';
import { createRpcMarketRepository } from 'src/repositories/rpcMarketRepository.js';
import type {
  CoinPrices,
  Market,
  MarketCollateral,
  MarketCollaterals,
  MarketPools,
} from 'src/types/index.js';
import type { Logger } from 'src/logger/index.js';
import type ScallopQuery from 'src/models/scallopQuery.js';
import type ScallopIndexer from 'src/models/scallopIndexer.js';

export type MarketServiceOptions = QueryOptions & {
  coinPrices?: CoinPrices;
};

export interface MarketServiceParams {
  query: ScallopQuery;
  indexer?: ScallopIndexer;
  logger?: Logger;
}

/**
 * Centralises source selection + fallback for the read-side market API.
 *
 * Internal-only design choice: both source branches go through repository
 * adapters. `RpcMarketRepository` calls lower-level query functions directly
 * to avoid recursion when `ScallopQuery` itself delegates here.
 */
export class MarketService {
  private readonly query: ScallopQuery;
  private readonly indexerRepository: ReturnType<
    typeof createIndexerMarketRepository
  >;
  private readonly rpcRepository: ReturnType<typeof createRpcMarketRepository>;
  private readonly logger?: Logger;

  constructor(params: MarketServiceParams) {
    this.query = params.query;
    const indexer = params.indexer ?? params.query.indexer;
    this.indexerRepository = createIndexerMarketRepository(indexer);
    this.rpcRepository = createRpcMarketRepository(this.query);
    this.logger = params.logger ?? params.query.utils.logger;
  }

  async queryMarket(options?: MarketServiceOptions): Promise<Market> {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'MarketService.queryMarket',
      logger: this.logger,
      indexer: () => this.indexerRepository.getMarket(options),
      rpc: () => this.rpcRepository.getMarket(options),
    });
  }

  async getMarketPools(
    poolCoinNames?: string[],
    options?: MarketServiceOptions
  ): Promise<{ pools: MarketPools; collaterals: MarketCollaterals }> {
    const source = resolveQuerySource(options);
    const names = poolCoinNames ?? [...this.query.constants.whitelist.lending];
    return runWithSourceFallback({
      source,
      label: 'MarketService.getMarketPools',
      logger: this.logger,
      indexer: () => this.indexerRepository.getMarketPools(names, options),
      rpc: () => this.rpcRepository.getMarketPools(names, options),
    });
  }

  async getMarketCollaterals(
    collateralCoinNames?: string[],
    options?: QueryOptions
  ): Promise<MarketCollaterals> {
    const source = resolveQuerySource(options);
    const names = collateralCoinNames ?? [
      ...this.query.constants.whitelist.collateral,
    ];
    return runWithSourceFallback({
      source,
      label: 'MarketService.getMarketCollaterals',
      logger: this.logger,
      indexer: () => this.indexerRepository.getMarketCollaterals(names),
      rpc: () => this.rpcRepository.getMarketCollaterals(names, options),
    });
  }

  async getMarketCollateral(
    collateralCoinName: string,
    options?: QueryOptions
  ): Promise<MarketCollateral | undefined> {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'MarketService.getMarketCollateral',
      logger: this.logger,
      indexer: () =>
        this.indexerRepository.getMarketCollateral(collateralCoinName),
      rpc: () =>
        this.rpcRepository.getMarketCollateral(collateralCoinName, options),
    });
  }
}
