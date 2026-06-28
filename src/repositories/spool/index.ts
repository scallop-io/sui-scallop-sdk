/**
 * spools
 * spool reward pools
 * stake accounts
 */

import type { IndexerDataSource } from 'src/datasources/indexer.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { CoinPrices } from 'src/types/utils.js';
import { BaseRepository } from '../base.js';
import type { QuerySource } from '../utils.js';
import { runWithDataSourceFallback } from '../utils.js';
import type {
  SpoolReadArgs,
  SpoolRepoParams,
  SpoolRepoContext,
  SpoolMetadata,
} from './types.js';
import {
  getSpoolFromIndexer,
  getSpoolFromOnChain,
  getSpoolRewardPoolsFromOnChain,
  getSpoolsFromIndexer,
  getSpoolsFromOnChain,
  getStakeAccountsFromOnChain,
  getStakePoolFromOnChain,
} from './helpers.js';

export class SpoolRepository extends BaseRepository<
  SpoolRepoContext,
  SpoolMetadata
> {
  private readonly indexer: IndexerDataSource;
  private readonly onchain: OnChainDataSource;

  constructor({ indexer, onchain, ...params }: SpoolRepoParams) {
    super(params);
    this.indexer = indexer;
    this.onchain = onchain;
  }

  get context() {
    return {
      ...this.baseContext,
      indexer: this.indexer,
      onchain: this.onchain,
    };
  }

  getSpools({
    stakeCoinNames,
    coinPrices,
    source = 'api-first',
  }: SpoolReadArgs & {
    source?: QuerySource;
  }) {
    return runWithDataSourceFallback({
      source,
      label: 'SpoolRepository.getSpools',
      logger: this.logger,
      api: () =>
        getSpoolsFromIndexer(this.context, {
          stakeCoinNames,
          coinPrices,
        }),
      onchain: () =>
        getSpoolsFromOnChain(this.context, {
          stakeCoinNames,
          coinPrices,
        }),
    });
  }

  getSpool({
    stakeCoinName,
    coinPrices,
    source = 'api-first',
  }: {
    stakeCoinName: string;
    coinPrices: CoinPrices;
    source?: QuerySource;
  }) {
    return runWithDataSourceFallback({
      source,
      label: 'SpoolRepository.getSpool',
      logger: this.logger,
      api: () =>
        getSpoolFromIndexer(this.context, {
          stakeCoinName,
          coinPrices,
        }),
      onchain: () =>
        getSpoolFromOnChain(this.context, {
          stakeCoinName,
          coinPrices,
        }),
    });
  }

  /**
   * Get stake accounts for all pools
   */
  getStakeAccounts(args: {
    address: string;
    stakeCoinNames?: readonly string[];
  }) {
    return getStakeAccountsFromOnChain(this.context, args);
  }

  /**
   * Get stake accounts for a specific pool
   */
  async getStakeAccountsByPool(address: string, poolName: string) {
    const allStakeAccounts = await this.getStakeAccounts({
      address,
      stakeCoinNames: [poolName],
    });
    return allStakeAccounts[poolName] || [];
  }

  getSpoolRewardPools(stakeCoinNames: string[]) {
    return getSpoolRewardPoolsFromOnChain(this.context, { stakeCoinNames });
  }

  getSpoolRewardPool(stakeCoinName: string) {
    return getSpoolRewardPoolsFromOnChain(this.context, {
      stakeCoinNames: [stakeCoinName],
    }).then((rewardPools) => rewardPools[stakeCoinName]);
  }

  /** The raw staking pool (`spool`) object for a stake market coin. */
  getStakePool(stakeCoinName: string) {
    return getStakePoolFromOnChain(this.context, stakeCoinName);
  }
}
