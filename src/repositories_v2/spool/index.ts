/**
 * spools
 * spool reward pools
 * stake accounts
 */

import type { IndexerDataSource } from 'src/datasources/indexer.js';
import type { CoinPrices } from 'src/types/utils.js';
import { BaseRepository } from '../base.js';
import type { QuerySource } from '../util.js';
import { runWithDataSourceFallback } from '../util.js';
import type {
  SpoolReadArgs,
  SpoolRepoArgs,
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
} from './helpers.js';

export class SpoolRepository extends BaseRepository<
  SpoolRepoContext,
  SpoolMetadata
> {
  protected readonly indexer: IndexerDataSource;
  declare protected readonly metadata: SpoolMetadata;

  constructor({ indexer, ...args }: SpoolRepoArgs) {
    super(args);
    this.indexer = indexer;
  }

  get context() {
    return {
      ...this.baseContext,
      indexer: this.indexer,
      metadata: this.metadata,
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
  getStakeAccounts({
    address,
    stakeCoinNames,
  }: {
    address: string;
    stakeCoinNames?: readonly string[];
  }) {
    return getStakeAccountsFromOnChain(this.context, {
      address,
      stakeCoinNames,
    });
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
}
