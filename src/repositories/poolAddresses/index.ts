import { ApiDataSource } from 'src/datasources/api.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { GraphQLDataSource } from 'src/datasources/graphql.js';
import { BaseRepository } from '../base.js';
import { QuerySource } from '../types.js';
import {
  PoolAddressesRepoParams,
  PoolAddressesRepoContext,
  PoolAddressesRepoMetadata,
} from './types.js';
import { runWithDataSourceFallback, runByReadTransport } from '../utils.js';
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
  private readonly grpc: GrpcDataSource;
  private readonly graphql?: GraphQLDataSource;
  private readonly preferGraphql: boolean;
  constructor({
    api,
    grpc,
    graphql,
    preferGraphql = false,
    ...params
  }: PoolAddressesRepoParams) {
    super(params);
    this.api = api;
    this.grpc = grpc;
    this.graphql = graphql;
    this.preferGraphql = preferGraphql;
  }

  get context() {
    return {
      ...this.baseContext,
      api: this.api,
      grpc: this.grpc,
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
        runByReadTransport({
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
