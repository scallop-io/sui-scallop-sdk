import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
} from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui.js/transactions';
import type { ScallopBuilder } from '../../models';
import type { SupportBorrowIncentiveCoins } from '../constant';

export type BorrowIncentiveIds = {
  borrowIncentivePkg: string;
  query: string;
  incentivePools: string;
  incentiveAccounts: string;
  obligationAccessStore: string;
};

export type BorrowIncentiveNormalMethods = {
  stakeObligation: (
    obligation: SuiAddressArg,
    obligaionKey: SuiAddressArg
  ) => void;
  unstakeObligation: (
    obligation: SuiAddressArg,
    obligaionKey: SuiAddressArg
  ) => void;
  claimBorrowIncentive: (
    obligation: SuiAddressArg,
    obligaionKey: SuiAddressArg,
    coinName: SupportBorrowIncentiveCoins
  ) => TransactionResult;
};

export type BorrowIncentiveQuickMethods = {
  stakeObligationQuick(
    obligation?: SuiAddressArg,
    obligationKey?: SuiAddressArg
  ): Promise<void>;
  unstakeObligationQuick(
    obligation?: SuiAddressArg,
    obligationKey?: SuiAddressArg
  ): Promise<void>;
  claimBorrowIncentiveQuick(
    coinName: SupportBorrowIncentiveCoins,
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
