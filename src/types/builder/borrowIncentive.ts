import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui.js/transactions';
import type { ScallopBuilder } from '../../models';
import type {
  SupportBorrowIncentiveCoins,
  SupportBorrowIncentiveRewardCoins,
} from '../constant';

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
    coinName: SupportBorrowIncentiveCoins,
    rewardType: SupportBorrowIncentiveRewardCoins
  ) => TransactionResult;
  deactivateBoost: (obligation: SuiObjectArg, veScaKey: SuiObjectArg) => void;
};

export type BorrowIncentiveQuickMethods = {
  stakeObligationQuick(
    obligation?: SuiObjectArg,
    obligationKey?: SuiObjectArg
  ): Promise<void>;
  stakeObligationWithVeScaQuick(
    obligation?: SuiObjectArg,
    obligationKey?: SuiObjectArg,
    veScaKey?: SuiObjectArg
  ): Promise<void>;
  unstakeObligationQuick(
    obligation?: SuiObjectArg,
    obligationKey?: SuiObjectArg
  ): Promise<void>;
  claimBorrowIncentiveQuick(
    coinName: SupportBorrowIncentiveCoins,
    rewardType: SupportBorrowIncentiveRewardCoins,
    obligation?: SuiObjectArg,
    obligationKey?: SuiObjectArg
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
