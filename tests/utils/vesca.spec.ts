import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findClosestUnlockRound } from 'src/utils/vesca.js';
import { partitionArray } from 'src/utils/array.js';
import { MAX_LOCK_DURATION } from 'src/constants/index.js';

describe('utils/vesca', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('finds the next UTC midnight unlock round', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const unlockAt = Math.floor(
      new Date('2026-01-01T12:34:56.000Z').getTime() / 1000
    );

    const result = findClosestUnlockRound(unlockAt);

    expect(result).toBe(
      Math.floor(new Date('2026-01-02T00:00:00.000Z').getTime() / 1000)
    );
  });

  it('caps unlock round at max lock duration from now', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    vi.setSystemTime(now);
    const unlockAt = Math.floor(now.getTime() / 1000) + MAX_LOCK_DURATION;

    const result = findClosestUnlockRound(unlockAt);

    expect(result).toBe(unlockAt);
  });

  it('partitions arrays into fixed-size chunks', () => {
    expect(partitionArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(partitionArray([], 3)).toEqual([]);
  });
});
