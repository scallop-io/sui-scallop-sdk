import type { QueryClient } from '@tanstack/query-core';
import type { SuiKit } from '@scallop-io/sui-kit';
import type { TransactionExecutor } from 'src/models/transactionExecutor.js';
import type ScallopConstants from 'src/models/scallopConstants.js';
import type { Logger } from 'src/logger/index.js';
import { noopLogger } from 'src/logger/index.js';

/**
 * Lightweight dependency container internal services can take in lieu of
 * reaching through getter chains (`client.builder.query.utils.suiKit...`).
 * Public constructors still accept their previous params; this is additive.
 */
export interface ScallopContext {
  readonly constants: ScallopConstants;
  readonly suiKit: SuiKit;
  readonly executor: TransactionExecutor;
  readonly queryClient: QueryClient;
  readonly logger: Logger;
  readonly walletAddress: string;
  readonly networkType?: string;
}

export type CreateScallopContextParams = {
  constants: ScallopConstants;
  suiKit: SuiKit;
  executor: TransactionExecutor;
  queryClient?: QueryClient;
  logger?: Logger;
  walletAddress?: string;
  networkType?: string;
};

export const createScallopContext = (
  params: CreateScallopContextParams
): ScallopContext => {
  const queryClient = params.queryClient ?? params.constants.queryClient;
  const walletAddress = params.walletAddress ?? params.suiKit.currentAddress;
  return {
    constants: params.constants,
    suiKit: params.suiKit,
    executor: params.executor,
    queryClient,
    logger: params.logger ?? noopLogger,
    walletAddress,
    networkType: params.networkType,
  };
};
