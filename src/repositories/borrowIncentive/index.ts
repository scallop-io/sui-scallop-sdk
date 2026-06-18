import { BaseRepository } from '../base.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
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
