import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Pyth network client so no real HTTP happens; count how many times a
// latest-price fetch is issued to prove the cache collapses duplicate calls.
const getLatestPriceUpdates = vi.fn();
vi.mock('@pythnetwork/pyth-sui-js', () => ({
  SuiPriceServiceConnection: class {
    getLatestPriceUpdates = getLatestPriceUpdates;
  },
}));

import { QueryClient } from '@tanstack/query-core';
import { getPythPricesFromPythApi } from 'src/repositories/price/helpers.js';
import { createFetchWithCache } from 'src/utils/cache.js';
import { DEFAULT_PYTH_URL } from 'src/repositories/price/const.js';
import type { PriceApiContext } from 'src/repositories/price/types.js';

const logger = {
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
} as never;

// Two coins with configured feeds (sorted: feed-a < feed-b), one coin with none.
const FEED_A = '0xaa';
const FEED_B = '0xbb';
const addresses = {
  coins: {
    sui: { oracle: { pyth: { feed: FEED_B } } },
    usdc: { oracle: { pyth: { feed: FEED_A } } },
    nofeed: { oracle: {} },
  },
} as never;

const makeCtx = (priceTimeout: number): PriceApiContext => {
  const queryClient = new QueryClient();
  return {
    fetchWithCache: createFetchWithCache(queryClient, logger),
    indexer: {} as never,
    metadata: { addresses },
    pythPriceServiceConfig: { endpoint: DEFAULT_PYTH_URL, config: {} },
    priceTimeout,
    logger,
  };
};

// Pyth returns parsed feeds keyed by id with { price, expo }.
const mockFeeds = () =>
  getLatestPriceUpdates.mockResolvedValue({
    parsed: [
      { id: FEED_A, price: { price: '100000000', expo: -8 } }, // 1
      { id: FEED_B, price: { price: '250000000', expo: -8 } }, // 2.5
    ],
  });

beforeEach(() => vi.clearAllMocks());

describe('getPythPricesFromPythApi', () => {
  it('fetches the FULL sorted feed universe even for a single-coin request', async () => {
    mockFeeds();
    const ctx = makeCtx(5_000);
    const prices = await getPythPricesFromPythApi(ctx, ['sui']);

    expect(getLatestPriceUpdates).toHaveBeenCalledTimes(1);
    // Full universe, sorted — not just [FEED_B] for 'sui'.
    expect(getLatestPriceUpdates.mock.calls[0][0]).toEqual([FEED_A, FEED_B]);
    expect(prices).toEqual({ sui: 2.5 });
  });

  it('dedups concurrent single + subset reads into ONE network call', async () => {
    mockFeeds();
    const ctx = makeCtx(5_000);
    const [single, subset] = await Promise.all([
      getPythPricesFromPythApi(ctx, ['sui']),
      getPythPricesFromPythApi(ctx, ['sui', 'usdc']),
    ]);

    // In-flight dedup: the concurrent callers share one fetch.
    expect(getLatestPriceUpdates).toHaveBeenCalledTimes(1);
    expect(single).toEqual({ sui: 2.5 });
    expect(subset).toEqual({ sui: 2.5, usdc: 1 });
  });

  it('serves a second read within priceTimeout from cache (no refetch)', async () => {
    mockFeeds();
    const ctx = makeCtx(5_000);
    await getPythPricesFromPythApi(ctx, ['sui']);
    await getPythPricesFromPythApi(ctx, ['usdc']);

    expect(getLatestPriceUpdates).toHaveBeenCalledTimes(1);
  });

  it('refetches when the cache is stale (priceTimeout = 0)', async () => {
    mockFeeds();
    const ctx = makeCtx(0);
    await getPythPricesFromPythApi(ctx, ['sui']);
    await getPythPricesFromPythApi(ctx, ['sui']);

    // staleTime 0 → every read is stale → each refetches.
    expect(getLatestPriceUpdates).toHaveBeenCalledTimes(2);
  });

  it('defaults coins with no configured feed to 0 and omits them from the fetch', async () => {
    mockFeeds();
    const ctx = makeCtx(5_000);
    const prices = await getPythPricesFromPythApi(ctx, ['sui', 'nofeed']);

    expect(prices).toEqual({ sui: 2.5, nofeed: 0 });
    // 'nofeed' has no feed id, so it never enters the requested id set.
    expect(getLatestPriceUpdates.mock.calls[0][0]).toEqual([FEED_A, FEED_B]);
  });

  it('defaults to 0 when a configured feed is missing from the API response', async () => {
    getLatestPriceUpdates.mockResolvedValue({
      parsed: [{ id: FEED_A, price: { price: '100000000', expo: -8 } }],
    });
    const ctx = makeCtx(5_000);
    const prices = await getPythPricesFromPythApi(ctx, ['sui', 'usdc']);

    expect(prices).toEqual({ sui: 0, usdc: 1 });
  });
});
