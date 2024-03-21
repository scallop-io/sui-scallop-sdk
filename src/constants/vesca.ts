export const SECONDS_IN_A_DAY = 60 * 60 * 24;
export const MAX_LOCK_ROUNDS: number = 1460; // 4 years
export const UNLOCK_ROUND_DURATION: number = SECONDS_IN_A_DAY; // 1 days
export const MAX_LOCK_DURATION: number = MAX_LOCK_ROUNDS * SECONDS_IN_A_DAY; // 4 years

export const MIN_TOP_UP_AMOUNT: number = 1 as const;
export const MIN_INITIAL_LOCK_AMOUNT: number = 10 as const;
