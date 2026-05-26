import type { QueryClient } from '@tanstack/query-core';
import type ScallopSuiKit from 'src/models/scallopSuiKit.js';
import type ScallopConstants from 'src/models/scallopConstants.js';
import type ScallopIndexer from 'src/models/scallopIndexer.js';
import type { Logger } from 'src/logger/index.js';
import { noopLogger } from 'src/logger/index.js';

/**
 * Lightweight dependency container internal services can take in lieu of
 * reaching through getter chains (`client.builder.query.utils.scallopSuiKit...`).
 * Public constructors still accept their previous params; this is additive.
 */
export interface ScallopContext {
  readonly constants: ScallopConstants;
  readonly scallopSuiKit: ScallopSuiKit;
  readonly indexer?: ScallopIndexer;
  readonly queryClient: QueryClient;
  readonly logger: Logger;
  readonly walletAddress: string;
  readonly networkType?: string;
}

export type CreateScallopContextParams = {
  constants: ScallopConstants;
  scallopSuiKit: ScallopSuiKit;
  indexer?: ScallopIndexer;
  queryClient?: QueryClient;
  logger?: Logger;
  walletAddress?: string;
  networkType?: string;
};

export const createScallopContext = (
  params: CreateScallopContextParams
): ScallopContext => {
  const queryClient = params.queryClient ?? params.constants.queryClient;
  const walletAddress =
    params.walletAddress ?? params.scallopSuiKit.walletAddress;
  return {
    constants: params.constants,
    scallopSuiKit: params.scallopSuiKit,
    indexer: params.indexer,
    queryClient,
    logger: params.logger ?? noopLogger,
    walletAddress,
    networkType: params.networkType,
  };
};
