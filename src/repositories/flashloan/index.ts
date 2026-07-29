/**
 * Flashloan Fees
 */

import { BaseRepository } from '../base.js';
import { GrpcDataSource } from '../../datasources/grpc.js';
import { GraphQLDataSource } from '../../datasources/graphql/index.js';
import {
  getFlashloanFeesFromGraphQL,
  getFlashloanFeesFromOnChain,
} from './helpers.js';
import {
  FlashloanMetadata,
  FlashloanRepoParams,
  FlashloanRepoContext,
} from './types.js';
import { runByReadTransport } from '../utils.js';

export class FlashloanRepository extends BaseRepository<
  FlashloanRepoContext,
  FlashloanMetadata
> {
  private readonly grpc: GrpcDataSource;
  private readonly graphql?: GraphQLDataSource;
  private readonly preferGraphql: boolean;

  constructor({
    grpc,
    graphql,
    preferGraphql = false,
    ...params
  }: FlashloanRepoParams) {
    super(params);
    this.grpc = grpc;
    this.graphql = graphql;
    this.preferGraphql = preferGraphql;
  }

  get context() {
    return {
      ...this.baseContext,
      grpc: this.grpc,
      graphql: this.graphql,
      preferGraphql: this.preferGraphql,
    };
  }

  getFlashloanFees(assetNames: string[]) {
    const ctx = this.context;
    const graphql = this.graphql;
    return runByReadTransport({
      preferGraphql: this.preferGraphql,
      logger: this.logger,
      label: 'FlashloanRepository.getFlashloanFees',
      graphql: graphql
        ? () => getFlashloanFeesFromGraphQL({ ...ctx, graphql }, { assetNames })
        : undefined,
      onchain: () => getFlashloanFeesFromOnChain(ctx, { assetNames }),
    });
  }
}
