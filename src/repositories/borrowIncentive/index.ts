import { BaseRepository } from '../base.js';
import {
  getBindedObligation,
  getBindedVeScaKeyByObligationIdFromOnChain,
  getBorrowIncentiveAccountsFromOnChain,
  getBorrowIncentivePoolsFromOnChain,
} from './helpers.js';
import {
  BorrowIncentiveRepoContext,
  BorrowIncentiveMetadata,
  BorrowIncentiveReadArgs,
  BorrowIncentiveRepoArgs,
} from './types.js';

export class BorrowIncentiveRepository extends BaseRepository<
  BorrowIncentiveRepoContext,
  BorrowIncentiveMetadata
> {
  constructor(args: BorrowIncentiveRepoArgs) {
    super(args);
  }

  get context() {
    return this.baseContext;
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
