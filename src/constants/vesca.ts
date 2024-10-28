export const UNLOCK_ROUND_DURATION = 60 * 60 * 24; // 1 day in seconds
export const MAX_LOCK_ROUNDS = 1460 as const; // 4 years in days (or 9 days for testing)
export const MAX_LOCK_DURATION = MAX_LOCK_ROUNDS * UNLOCK_ROUND_DURATION; // 4 years in seconds

export const MIN_INITIAL_LOCK_AMOUNT = 10_000_000_000 as const;
export const MIN_TOP_UP_AMOUNT = 1_000_000_000 as const;
