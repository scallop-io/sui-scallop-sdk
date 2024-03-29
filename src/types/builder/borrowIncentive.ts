import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
  SuiTxArg,
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
    obligation: SuiAddressArg,
    obligationKey: SuiAddressArg
  ) => void;
  stakeObligationWithVesca: (
    obligation: SuiAddressArg,
    obligationKey: SuiAddressArg,
    veScaKey: SuiTxArg
  ) => void;
  unstakeObligation: (
    obligation: SuiAddressArg,
    obligationKey: SuiAddressArg
  ) => void;
  claimBorrowIncentive: (
    obligation: SuiAddressArg,
    obligationKey: SuiAddressArg,
    coinName: SupportBorrowIncentiveCoins,
    rewardType: SupportBorrowIncentiveRewardCoins
  ) => TransactionResult;
};

export type BorrowIncentiveQuickMethods = {
  stakeObligationQuick(
    obligation?: SuiAddressArg,
    obligationKey?: SuiAddressArg
  ): Promise<void>;
  stakeObligationWithVeScaQuick(
    obligation?: SuiAddressArg,
    obligationKey?: SuiAddressArg,
    veScaKey?: SuiAddressArg
  ): Promise<void>;
  unstakeObligationQuick(
    obligation?: SuiAddressArg,
    obligationKey?: SuiAddressArg
  ): Promise<void>;
  claimBorrowIncentiveQuick(
    coinName: SupportBorrowIncentiveCoins,
    rewardType: SupportBorrowIncentiveRewardCoins,
    obligation?: SuiAddressArg,
    obligationKey?: SuiAddressArg
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
