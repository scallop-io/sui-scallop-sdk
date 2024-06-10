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
  mintEmptyVeSca: () => TransactionResult;
};

export type VeScaQuickMethods = {
  /**
   * Quick methods to automate
   * lock initial SCA, extend lock period, lock more SCA, renew expired VeSCA, and redeem SCA
   *
   * **Flow:**
   * - If only `amountOrCoin` is provided, it will lock the amount of existing not expired veSCA
   * - If only `lockPeriodInDays` is provided, it will extend the lock period of existing not expired veSCA
   *
   * **Note:**
   * - If one or both flow above is used on a expired veSCA, it will claim the unlocked SCA
   *   and renew the veSCA first, and then flow continues
   * - If users has no veSCA yet, they need to provide both `amountOrCoin` and `lockPeriodInDays` for initial lock
   * @param amountOrCoin
   * @param lockPeriodInDays
   * @param autoCheck
   */
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
