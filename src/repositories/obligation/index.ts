/**
 * obligations by owner
 * obligation by id
 * obligation accounts raw/normalized (moved to service due to requiring multiple repos)
 */

import { BaseRepository } from '../base.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { GraphQLDataSource } from 'src/datasources/graphql/index.js';
import {
  getObligationLockedFromOnChain,
  getObligationNamesFromGraphQL,
  getObligationNamesFromOnChain,
  getObligationObjectsFromOnChain,
  getObligationsFromOnChain,
  queryObligationData,
  queryObligationsData,
} from './helpers.js';
import {
  ObligationRepoParams,
  ObligationRepoContext,
  ObligationRepoMetadata,
} from './types.js';
import { runByReadTransport } from '../utils.js';

export class ObligationRepository extends BaseRepository<
  ObligationRepoContext,
  ObligationRepoMetadata
> {
  private readonly grpc: GrpcDataSource;
  private readonly graphql?: GraphQLDataSource;
  private readonly preferGraphql: boolean;

  constructor({
    grpc,
    graphql,
    preferGraphql = false,
    ...params
  }: ObligationRepoParams) {
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

  getObligations(address: string) {
    return getObligationsFromOnChain(this.context, { address });
  }

  getObligationData(obligationId: string) {
    return queryObligationData(this.context, obligationId);
  }

  /**
   * Batch-query obligation data for many ids in one `simulateTransaction`
   * (one `moveCall` per obligation), returning a map keyed by obligation id.
   * Falls back to per-obligation queries on a batch failure.
   */
  getObligationsData(obligationIds: string[]) {
    return queryObligationsData(this.context, obligationIds);
  }

  getObligationLocked(obligationId: string) {
    return getObligationLockedFromOnChain(this.context, obligationId);
  }

  getObligationObjects(ids: string[]) {
    return getObligationObjectsFromOnChain(this.context, ids);
  }

  getObligationNames(address: string) {
    const ctx = this.context;
    const graphql = this.graphql;
    return runByReadTransport({
      preferGraphql: this.preferGraphql,
      logger: this.logger,
      label: 'ObligationRepository.getObligationNames',
      graphql: graphql
        ? () => getObligationNamesFromGraphQL({ ...ctx, graphql }, address)
        : undefined,
      onchain: () => getObligationNamesFromOnChain(ctx, address),
    });
  }
}
