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

export const checkLockSca = (
  scaAmountOrCoin?: number | SuiObjectArg | undefined,
  lockPeriodInDays?: number,
  newUnlockAtInSecondTimestamp?: number,
  prevUnlockAtInSecondTimestamp?: number
) => {
  const isInitialLock = !prevUnlockAtInSecondTimestamp;
  const isLockExpired =
    !isInitialLock &&
    prevUnlockAtInSecondTimestamp * 1000 <= new Date().getTime();
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
    checkVesca(prevUnlockAtInSecondTimestamp);
    if (
      typeof scaAmountOrCoin === 'number' &&
      scaAmountOrCoin < MIN_TOP_UP_AMOUNT
    ) {
      throw new Error('Minimum top up amount is 1 SCA');
    }

    if (!!newUnlockAtInSecondTimestamp && !!prevUnlockAtInSecondTimestamp) {
      const totalLockDuration =
        newUnlockAtInSecondTimestamp - prevUnlockAtInSecondTimestamp;
      if (totalLockDuration > MAX_LOCK_DURATION - UNLOCK_ROUND_DURATION) {
        throw new Error(
          `Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`
        );
      }
    }
  }
};

export const checkExtendLockPeriod = (
  lockPeriodInDays: number,
  newUnlockAtInSecondTimestamp: number,
  prevUnlockAtInSecondTimestamp?: number
) => {
  checkVesca(prevUnlockAtInSecondTimestamp);

  if (lockPeriodInDays <= 0) {
    throw new Error('Lock period must be greater than 0');
  }

  const isInitialLock = !prevUnlockAtInSecondTimestamp;
  const isLockExpired =
    !isInitialLock &&
    prevUnlockAtInSecondTimestamp * 1000 <= new Date().getTime();
  if (isLockExpired) {
    throw new Error('veSca is expired, use renewExpiredVeScaQuick instead');
  }

  if (prevUnlockAtInSecondTimestamp) {
    const totalLockDuration =
      newUnlockAtInSecondTimestamp - prevUnlockAtInSecondTimestamp!;
    if (totalLockDuration > MAX_LOCK_DURATION - UNLOCK_ROUND_DURATION) {
      throw new Error(
        `Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`
      );
    }
  }
};

export const checkExtendLockAmount = (
  scaAmount: number,
  prevUnlockAtInSecondTimestamp?: number
) => {
  checkVesca(prevUnlockAtInSecondTimestamp);

  if (scaAmount < MIN_TOP_UP_AMOUNT) {
    throw new Error('Minimum top up amount is 1 SCA');
  }

  const isInitialLock = !prevUnlockAtInSecondTimestamp;
  const isLockExpired =
    !isInitialLock &&
    prevUnlockAtInSecondTimestamp * 1000 <= new Date().getTime();
  if (isLockExpired) {
    throw new Error('veSca is expired, use renewExpiredVeScaQuick instead');
  }
};

export const checkRenewExpiredVeSca = (
  scaAmount: number,
  lockPeriodInDays: number,
  prevUnlockAtInSecondTimestamp?: number
) => {
  checkVesca(prevUnlockAtInSecondTimestamp);

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

export const checkVesca = (prevUnlockAtInSecondTimestamp?: number) => {
  if (prevUnlockAtInSecondTimestamp === undefined) {
    throw new Error('veSca not found');
  }
};
