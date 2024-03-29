import { IS_VE_SCA_TEST } from './common';

export const UNLOCK_ROUND_DURATION = 60 * 60 * 24; // 1 days in seconds
export const MAX_LOCK_ROUNDS: number = IS_VE_SCA_TEST ? 9 : 1460; // 4 years in days (or 9 days for testing)
export const MAX_LOCK_DURATION: number =
  MAX_LOCK_ROUNDS * UNLOCK_ROUND_DURATION; // 4 years in seconds

export const MIN_INITIAL_LOCK_AMOUNT: number = 10_000_000_000 as const;
export const MIN_TOP_UP_AMOUNT: number = 1_000_000_000 as const;
