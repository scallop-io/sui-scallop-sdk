import { BaseRepository } from '../base.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import {
  getBindedObligation,
  getBindedVeScaKeyByObligationIdFromOnChain,
  getBorrowIncentiveAccountsBatchFromOnChain,
  getBorrowIncentiveAccountsFromOnChain,
  getBorrowIncentivePoolsFromOnChain,
} from './helpers.js';
import {
  BorrowIncentiveRepoContext,
  BorrowIncentiveMetadata,
  BorrowIncentiveReadArgs,
  BorrowIncentiveRepoParams,
} from './types.js';

export class BorrowIncentiveRepository extends BaseRepository<
  BorrowIncentiveRepoContext,
  BorrowIncentiveMetadata
> {
  private readonly onchain: OnChainDataSource;

  constructor({ onchain, ...params }: BorrowIncentiveRepoParams) {
    super(params);
    this.onchain = onchain;
  }

  get context() {
    return { ...this.baseContext, onchain: this.onchain };
  }

  getBorrowIncentivePools(args: BorrowIncentiveReadArgs) {
    return getBorrowIncentivePoolsFromOnChain(this.context, args);
  }

  getBorrowIncentiveAccounts(args: {
    obligationId: string;
    coinNames?: string[];
  }) {
    return getBorrowIncentiveAccountsFromOnChain(this.context, args);
  }

  /**
   * Batch-query borrow-incentive accounts for many obligations in one
   * `simulateTransaction`, returning a map keyed by obligation id. Falls back
   * to per-obligation queries on a batch failure.
   */
  getBorrowIncentiveAccountsBatch(args: {
    obligationIds: string[];
    coinNames?: string[];
  }) {
    return getBorrowIncentiveAccountsBatchFromOnChain(this.context, args);
  }

  getBindedVeScaKey(obligationId: string) {
    return getBindedVeScaKeyByObligationIdFromOnChain(
      this.context,
      obligationId
    );
  }

  getBindedObligation(veScaKey: string) {
    return getBindedObligation(this.context, veScaKey);
  }
}
