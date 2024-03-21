import {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
  SuiObjectArg,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui.js/transactions';
import { ScallopBuilder } from 'src/models';

export type VescaIds = {
  pkgId: string;
  table: string;
  treasury: string;
  config: string;
};

export type VeScaNormalMethods = {
  lockSca: (
    scaCoin: SuiObjectArg,
    unlockAtInSecondTimestamp: SuiTxArg
  ) => TransactionResult;
  extendLockPeriod: (
    veScaKey: SuiAddressArg,
    newUnlockAtInSecondTimestamp: SuiTxArg
  ) => void;
  extendLockAmount: (veScaKey: SuiAddressArg, scaCoin: SuiObjectArg) => void;
  renewExpiredVeSca: (
    veScaKey: SuiAddressArg,
    scaCoin: SuiObjectArg,
    newUnlockAtInSecondTimestamp: SuiTxArg
  ) => void;
  redeemSca: (veScaKey: SuiAddressArg) => TransactionResult;
};

export type VeScaQuickMethods = {
  lockScaQuick(
    amountOrCoin?: SuiObjectArg | number,
    lockPeriodInDays?: number
  ): Promise<void>;
  extendLockPeriodQuick: (
    lockPeriodInDays: number,
    veScaKey?: SuiAddressArg
  ) => Promise<void>;
  extendLockAmountQuick: (
    scaCoinAmount: number,
    veScaKey?: SuiAddressArg
  ) => Promise<void>;
  renewExpiredVeScaQuick: (
    scaCoinAmount: number,
    lockPeriodInDays: number,
    veScaKey?: SuiAddressArg
  ) => Promise<void>;
  redeemScaQuick: (veScaKey?: SuiAddressArg) => Promise<void>;
};

export type SuiTxBlockWithVeScaNormalMethods = SuiKitTxBlock &
  VeScaNormalMethods;

export type VeScaTxBlock = SuiTxBlockWithVeScaNormalMethods & VeScaQuickMethods;

export type GenerateVeScaNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => VeScaNormalMethods;

export type GenerateVeScaQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithVeScaNormalMethods;
}) => VeScaQuickMethods;
