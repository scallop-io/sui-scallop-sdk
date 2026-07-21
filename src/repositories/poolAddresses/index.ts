import { ApiDataSource } from 'src/datasources/api.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { GraphQLDataSource } from 'src/datasources/graphql.js';
import { BaseRepository } from '../base.js';
import { QuerySource } from '../types.js';
import {
  PoolAddressesRepoParams,
  PoolAddressesRepoContext,
  PoolAddressesRepoMetadata,
} from './types.js';
import { runWithDataSourceFallback, runWithGraphQLFallback } from '../utils.js';
import {
  getPoolAddressesFromApi,
  getPoolAddressesFromGraphQL,
  getPoolAddressesFromOnChain,
} from './helpers.js';

export class PoolAddressesRepository extends BaseRepository<
  PoolAddressesRepoContext,
  PoolAddressesRepoMetadata
> {
  private readonly api: ApiDataSource;
  private readonly onchain: OnChainDataSource;
  private readonly graphql?: GraphQLDataSource;
  private readonly preferGraphql: boolean;
  constructor({
    api,
    onchain,
    graphql,
    preferGraphql = false,
    ...params
  }: PoolAddressesRepoParams) {
    super(params);
    this.api = api;
    this.onchain = onchain;
    this.graphql = graphql;
    this.preferGraphql = preferGraphql;
  }

  get context() {
    return {
      ...this.baseContext,
      api: this.api,
      onchain: this.onchain,
      graphql: this.graphql,
      preferGraphql: this.preferGraphql,
    };
  }

  /**
   * Get pool addresses from the API, or rebuild them from on-chain data.
   * Both paths derive coin config from the repo metadata; `source` selects
   * which (defaults to the API). Under the GraphQL transport, the on-chain
   * rebuild prefers a native nested GraphQL query and falls back to the gRPC
   * multi-call path on failure.
   */
  getPoolAddresses({
    poolNames,
    source = 'api',
  }: {
    poolNames?: string[];
    source?: QuerySource;
  }) {
    const ctx = this.context;
    const graphql = this.graphql;
    return runWithDataSourceFallback({
      source,
      label: 'PoolAddressesRepository.getPoolAddresses',
      logger: this.logger,
      api: () => getPoolAddressesFromApi(ctx, { poolNames }),
      onchain: () =>
        runWithGraphQLFallback({
          preferGraphql: this.preferGraphql,
          logger: this.logger,
          label: 'PoolAddressesRepository.getPoolAddresses',
          graphql: graphql
            ? () =>
                getPoolAddressesFromGraphQL({ ...ctx, graphql }, { poolNames })
            : undefined,
          onchain: () => getPoolAddressesFromOnChain(ctx, { poolNames }),
        }),
    });
  }
}
