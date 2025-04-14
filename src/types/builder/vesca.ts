import { SuiTxBlock as SuiKitTxBlock, SuiObjectArg } from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui/transactions';
import { ScallopBuilder } from 'src/models';

export type VeScaNormalMethods = {
  lockSca: (
    scaCoin: SuiObjectArg,
    unlockAtInSecondTimestamp: number
  ) => TransactionResult;
  extendLockPeriod: (
    veScaKey: SuiObjectArg,
    newUnlockAtInSecondTimestamp: number
  ) => void;
  extendLockAmount: (veScaKey: SuiObjectArg, scaCoin: SuiObjectArg) => void;
  renewExpiredVeSca: (
    veScaKey: SuiObjectArg,
    scaCoin: SuiObjectArg,
    newUnlockAtInSecondTimestamp: number
  ) => void;
  redeemSca: (veScaKey: SuiObjectArg) => TransactionResult;
  mintEmptyVeSca: () => TransactionResult;
  splitVeSca: (
    veScaKey: SuiObjectArg,
    splitAmount: string
  ) => TransactionResult;
  mergeVeSca: (
    targetVeScaKey: SuiObjectArg,
    sourceVeScaKey: SuiObjectArg
  ) => void;
};

export type QuickMethodReturnType<T extends boolean> = T extends true
  ? void
  : TransactionResult | undefined;

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
  redeemScaQuick: <T extends boolean>(
    veScaKey?: SuiObjectArg,
    transferSca?: T
  ) => Promise<QuickMethodReturnType<T>>;
  splitVeScaQuick: <T extends boolean>(
    splitAmount: string,
    veScaKey: string,
    transferVeScaKey?: T
  ) => Promise<QuickMethodReturnType<T>>;
  mergeVeScaQuick: (
    targetVeScaKey: string,
    sourceVeScaKey: string
  ) => Promise<void>;
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
