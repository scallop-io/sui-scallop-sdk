import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui/transactions';
import type { ScallopBuilder } from 'src/models';
import type { SupportBorrowIncentiveRewardCoins } from 'src/types/constant';

export type BorrowIncentiveIds = {
  borrowIncentivePkg: string;
  query: string;
  config: string;
  incentivePools: string;
  incentiveAccounts: string;
  obligationAccessStore: string;
};

export type BorrowIncentiveNormalMethods = {
  stakeObligation: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg
  ) => void;
  stakeObligationWithVesca: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    veScaKey: SuiObjectArg
  ) => void;
  unstakeObligation: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg
  ) => void;
  claimBorrowIncentive: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    rewardType: SupportBorrowIncentiveRewardCoins
  ) => TransactionResult;
  deactivateBoost: (obligation: SuiObjectArg, veScaKey: SuiObjectArg) => void;
};

export type BorrowIncentiveQuickMethods = {
  stakeObligationQuick(
    obligation?: string,
    obligationKey?: string
  ): Promise<void>;
  stakeObligationWithVeScaQuick(
    obligation?: string,
    obligationKey?: string,
    veScaKey?: string
  ): Promise<void>;
  unstakeObligationQuick(
    obligation?: string,
    obligationKey?: string
  ): Promise<void>;
  claimBorrowIncentiveQuick(
    rewardType: SupportBorrowIncentiveRewardCoins,
    obligation?: string,
    obligationKey?: string
  ): Promise<TransactionResult>;
};

export type SuiTxBlockWithBorrowIncentiveNormalMethods = SuiKitTxBlock &
  BorrowIncentiveNormalMethods;

export type BorrowIncentiveTxBlock =
  SuiTxBlockWithBorrowIncentiveNormalMethods & BorrowIncentiveQuickMethods;

export type GenerateBorrowIncentiveNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => BorrowIncentiveNormalMethods;

export type GenerateBorrowIncentiveQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithBorrowIncentiveNormalMethods;
}) => BorrowIncentiveQuickMethods;
