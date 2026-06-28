import { ApiDataSource } from 'src/datasources/api.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { BaseRepository } from '../base.js';
import { QuerySource } from '../types.js';
import {
  PoolAddressesRepoParams,
  PoolAddressesRepoContext,
  PoolAddressesRepoMetadata,
} from './types.js';
import { runWithDataSourceFallback } from '../utils.js';
import {
  getPoolAddressesFromApi,
  getPoolAddressesFromOnChain,
} from './helpers.js';

export class PoolAddressesRepository extends BaseRepository<
  PoolAddressesRepoContext,
  PoolAddressesRepoMetadata
> {
  private readonly api: ApiDataSource;
  private readonly onchain: OnChainDataSource;
  constructor({ api, onchain, ...params }: PoolAddressesRepoParams) {
    super(params);
    this.api = api;
    this.onchain = onchain;
  }

  get context() {
    return {
      ...this.baseContext,
      api: this.api,
      onchain: this.onchain,
    };
  }

  /**
   * Get pool addresses from the API, or rebuild them from on-chain data.
   * Both paths derive coin config from the repo metadata; `source` selects
   * which (defaults to the API).
   */
  getPoolAddresses({
    poolNames,
    source = 'api',
  }: {
    poolNames?: string[];
    source?: QuerySource;
  }) {
    return runWithDataSourceFallback({
      source,
      label: 'PoolAddressesRepository.getPoolAddresses',
      logger: this.logger,
      api: () => getPoolAddressesFromApi(this.context, { poolNames }),
      onchain: () => getPoolAddressesFromOnChain(this.context, { poolNames }),
    });
  }
}
