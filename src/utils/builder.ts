import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import {
  UNLOCK_ROUND_DURATION,
  MAX_LOCK_DURATION,
  MAX_LOCK_ROUNDS,
  MIN_INITIAL_LOCK_AMOUNT,
  MIN_TOP_UP_AMOUNT,
} from '../constants';
import type { SuiObjectArg } from '@scallop-io/sui-kit';

/**
 * Check and get the sender from the transaction block.
 *
 * @param txBlock - TxBlock created by SuiKit.
 * @return Sender of transaction.
 */
export const requireSender = (txBlock: SuiKitTxBlock) => {
  const sender = txBlock.blockData.sender;
  if (!sender) {
    throw new Error('Sender is required');
  }
  return sender;
};

export const checkVesca = (prevUnlockAtInMillisTimestamp?: number) => {
  if (prevUnlockAtInMillisTimestamp === undefined) {
    throw new Error('veSca not found');
  }
};

export const checkVescaExpired = (prevUnlockAtInMillisTimestamp: number) => {
  if (prevUnlockAtInMillisTimestamp <= new Date().getTime()) {
    throw new Error('veSca is expired, use renewExpiredVeScaQuick instead');
  }
};

export const checkExtendLockPeriod = (
  lockPeriodInDays: number,
  newUnlockAtInSecondTimestamp: number,
  prevUnlockAtInMillisTimestamp?: number
) => {
  checkVesca(prevUnlockAtInMillisTimestamp);
  checkVescaExpired(prevUnlockAtInMillisTimestamp!);
  const prevUnlockAtInSecondTimestamp = Math.floor(
    prevUnlockAtInMillisTimestamp! / 1000
  );
  if (lockPeriodInDays < 1) {
    throw new Error('Minimum lock period is 1 day');
  }

  const availableLockPeriodInDays = Math.floor(
    (newUnlockAtInSecondTimestamp - prevUnlockAtInSecondTimestamp) /
      UNLOCK_ROUND_DURATION
  );
  console.log('availableLockPeriodInDays', availableLockPeriodInDays);
  if (lockPeriodInDays > availableLockPeriodInDays) {
    throw new Error(
      `Cannot extend lock period by ${lockPeriodInDays} days, maximum lock period is ~4 years (${MAX_LOCK_ROUNDS} days), remaining lock period is ${
        MAX_LOCK_ROUNDS - availableLockPeriodInDays
      }`
    );
  }
};

export const checkLockSca = (
  scaAmountOrCoin: number | SuiObjectArg | undefined,
  lockPeriodInDays?: number,
  newUnlockAtInSecondTimestamp?: number,
  prevUnlockAtInMillisTimestamp?: number
) => {
  const prevUnlockAtInSecondTimestamp = prevUnlockAtInMillisTimestamp
    ? Math.floor(prevUnlockAtInMillisTimestamp / 1000)
    : undefined;
  const isInitialLock = !prevUnlockAtInSecondTimestamp;
  const isLockExpired =
    !isInitialLock &&
    prevUnlockAtInSecondTimestamp * 1000 <= new Date().getTime();

  // handle for initial lock / renewing expired veSca
  if (isInitialLock || isLockExpired) {
    if (scaAmountOrCoin !== undefined && lockPeriodInDays !== undefined) {
      if (lockPeriodInDays <= 0) {
        throw new Error('Lock period must be greater than 0');
      }
      if (
        typeof scaAmountOrCoin === 'number' &&
        scaAmountOrCoin < MIN_INITIAL_LOCK_AMOUNT
      ) {
        throw new Error(
          `Minimum lock amount for ${
            isLockExpired ? 'renewing expired veSca' : 'initial lock'
          } is 10 SCA`
        );
      }
      const extendLockPeriodInSecond = lockPeriodInDays * UNLOCK_ROUND_DURATION;
      if (extendLockPeriodInSecond > MAX_LOCK_DURATION) {
        throw new Error(
          `Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS} days)`
        );
      }
    } else {
      throw new Error(
        `SCA amount and lock period is required for ${
          isLockExpired ? 'renewing expired veSca' : 'initial lock'
        }`
      );
    }
  } else {
    // handle for extending lock period / top up / both
    checkVesca(prevUnlockAtInMillisTimestamp);
    checkVescaExpired(prevUnlockAtInMillisTimestamp!);
    if (
      typeof scaAmountOrCoin === 'number' &&
      scaAmountOrCoin < MIN_TOP_UP_AMOUNT
    ) {
      throw new Error('Minimum top up amount is 1 SCA');
    }

    // for topup and extend lock period
    if (newUnlockAtInSecondTimestamp && lockPeriodInDays) {
      checkExtendLockPeriod(
        lockPeriodInDays,
        newUnlockAtInSecondTimestamp,
        prevUnlockAtInMillisTimestamp
      );
    }
  }
};

export const checkExtendLockAmount = (
  scaAmount: number,
  prevUnlockAtInMillisTimestamp?: number
) => {
  checkVesca(prevUnlockAtInMillisTimestamp);
  checkVescaExpired(prevUnlockAtInMillisTimestamp!);

  if (scaAmount < MIN_TOP_UP_AMOUNT) {
    throw new Error('Minimum top up amount is 1 SCA');
  }

  const isInitialLock = !prevUnlockAtInMillisTimestamp;
  const isLockExpired =
    !isInitialLock && prevUnlockAtInMillisTimestamp <= new Date().getTime();

  if (isLockExpired) {
    throw new Error('veSca is expired, use renewExpiredVeScaQuick instead');
  }
};

export const checkRenewExpiredVeSca = (
  scaAmount: number,
  lockPeriodInDays: number,
  prevUnlockAtInMillisTimestamp?: number
) => {
  if (
    !prevUnlockAtInMillisTimestamp ||
    prevUnlockAtInMillisTimestamp > new Date().getTime()
  ) {
    throw new Error('Renew method can only be used for expired veSca');
  }

  if (scaAmount < MIN_INITIAL_LOCK_AMOUNT) {
    throw new Error('Minimum lock amount for renewing expired vesca 10 SCA');
  }

  const extendLockPeriodInSecond = lockPeriodInDays * UNLOCK_ROUND_DURATION;
  if (extendLockPeriodInSecond >= MAX_LOCK_DURATION - UNLOCK_ROUND_DURATION) {
    throw new Error(
      `Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`
    );
  }
};
