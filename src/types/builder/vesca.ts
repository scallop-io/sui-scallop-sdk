import {
  SuiTxBlock as SuiKitTxBlock,
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
    veScaKey: SuiObjectArg,
    newUnlockAtInSecondTimestamp: SuiTxArg
  ) => void;
  extendLockAmount: (veScaKey: SuiObjectArg, scaCoin: SuiObjectArg) => void;
  renewExpiredVeSca: (
    veScaKey: SuiObjectArg,
    scaCoin: SuiObjectArg,
    newUnlockAtInSecondTimestamp: SuiTxArg
  ) => void;
  redeemSca: (veScaKey: SuiObjectArg) => TransactionResult;
};

export type VeScaQuickMethods = {
  lockScaQuick(
    amountOrCoin?: SuiObjectArg | number,
    lockPeriodInDays?: number,
    autoCheck?: boolean
  ): Promise<void>;
  extendLockPeriodQuick: (
    lockPeriodInDays: number,
    veScaKey?: SuiObjectArg,
    autoCheck?: boolean
  ) => Promise<void>;
  extendLockAmountQuick: (
    scaAmount: number,
    veScaKey?: SuiObjectArg,
    autoCheck?: boolean
  ) => Promise<void>;
  renewExpiredVeScaQuick: (
    scaAmount: number,
    lockPeriodInDays: number,
    veScaKey?: SuiObjectArg,
    autoCheck?: boolean
  ) => Promise<void>;
  redeemScaQuick: (veScaKey?: SuiObjectArg) => Promise<void>;
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
