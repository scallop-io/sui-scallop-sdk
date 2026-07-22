/**
 * Flashloan Fees
 */

import { BaseRepository } from '../base.js';
import { OnChainDataSource } from '../../datasources/onchain.js';
import { GraphQLDataSource } from '../../datasources/graphql.js';
import {
  getFlashloanFeesFromGraphQL,
  getFlashloanFeesFromOnChain,
} from './helpers.js';
import {
  FlashloanMetadata,
  FlashloanRepoParams,
  FlashloanRepoContext,
} from './types.js';
import { runWithGraphQLFallback } from '../utils.js';

export class FlashloanRepository extends BaseRepository<
  FlashloanRepoContext,
  FlashloanMetadata
> {
  private readonly onchain: OnChainDataSource;
  private readonly graphql?: GraphQLDataSource;
  private readonly preferGraphql: boolean;

  constructor({
    onchain,
    graphql,
    preferGraphql = false,
    ...params
  }: FlashloanRepoParams) {
    super(params);
    this.onchain = onchain;
    this.graphql = graphql;
    this.preferGraphql = preferGraphql;
  }

  get context() {
    return {
      ...this.baseContext,
      onchain: this.onchain,
      graphql: this.graphql,
      preferGraphql: this.preferGraphql,
    };
  }

  getFlashloanFees(assetNames: string[]) {
    const ctx = this.context;
    const graphql = this.graphql;
    return runWithGraphQLFallback({
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
