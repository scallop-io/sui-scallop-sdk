import { BaseRepository } from '../base.js';
import {
  getBorrowIncentiveAccountsFromOnChain,
  getBorrowIncentivePoolsFromOnChain,
} from './helpers.js';
import {
  BorrowIncentiveAddressConfig,
  BorrowIncentiveRepoContext,
  BorrowIncentiveMetadata,
  BorrowIncentiveReadArgs,
  BorrowIncentiveRepoArgs,
} from './types.js';

export class BorrowIncentiveRepository extends BaseRepository<
  BorrowIncentiveRepoContext,
  BorrowIncentiveMetadata
> {
  private readonly addresses: BorrowIncentiveAddressConfig;
  declare protected readonly metadata: BorrowIncentiveMetadata;

  constructor({ addresses, ...args }: BorrowIncentiveRepoArgs) {
    super(args);
    this.addresses = addresses;
  }

  get context() {
    return {
      ...this.baseContext,
      addresses: this.addresses,
      metadata: this.metadata,
    };
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
}
