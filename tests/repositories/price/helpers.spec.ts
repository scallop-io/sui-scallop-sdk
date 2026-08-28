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
import {
  getCoingeckoPrices,
  getPricesFromIndexer,
  getPythPricesFromIndexerApi,
  getPythPricesFromPythApi,
} from 'src/repositories/price/helpers.js';
import { createFetchWithCache } from 'src/utils/cache.js';
import { DEFAULT_PYTH_URL } from 'src/repositories/price/const.js';
import type { PriceApiContext } from 'src/repositories/price/types.js';

const logger = {
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
} as never;

// Two coins with configured feeds (sorted: feed-a < feed-b), one coin with none,
// and one (`sca`) whose feed is stale because it migrated off pyth.
const FEED_A = '0xaa';
const FEED_B = '0xbb';
const FEED_STALE = '0xcc';
const addresses = {
  coins: {
    sui: { oracle: { pyth: { feed: FEED_B } }, coinType: '0x2::sui::SUI' },
    usdc: { oracle: { pyth: { feed: FEED_A } }, coinType: '0xu::usdc::USDC' },
    nofeed: { oracle: {} },
    sca: {
      oracle: { pyth: { feed: FEED_STALE } },
      coinType: '0xs::sca::SCA',
    },
  },
} as never;

// `sca` keeps a stale pyth feed in the address map but is priced by the custom
// oracle — every pyth read must skip it.
const NON_PYTH_COIN_NAMES = new Set(['sca']);

const makeCtx = (priceTimeout: number): PriceApiContext => {
  const queryClient = new QueryClient();
  return {
    fetchWithCache: createFetchWithCache(queryClient, logger),
    indexer: {} as never,
    metadata: { addresses, nonPythCoinNames: NON_PYTH_COIN_NAMES },
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

  it('skips a coin whose xOracle rules moved it off pyth', async () => {
    // intent: SCA is priced by the custom oracle now — its leftover pyth feed
    // must neither be fetched nor reported as a price, or callers would read a
    // stale number that no longer backs the protocol.
    mockFeeds();
    const ctx = makeCtx(5_000);
    const prices = await getPythPricesFromPythApi(ctx, ['sui', 'sca']);

    expect(prices).toEqual({ sui: 2.5, sca: 0 });
    expect(getLatestPriceUpdates.mock.calls[0][0]).not.toContain(FEED_STALE);
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

describe('getPythPricesFromIndexerApi', () => {
  // This payload is keyed by coinType, not by pyth feed id, so the exclusion
  // cannot ride along on the feed-id universe — it has to gate the fan-out.
  const indexerCtx = (payload: Record<string, unknown>) => {
    const queryClient = new QueryClient();
    return {
      fetchWithCache: createFetchWithCache(queryClient, logger),
      indexer: {
        url: 'mock://indexer',
        get: vi.fn().mockResolvedValue(payload),
      },
      metadata: { addresses, nonPythCoinNames: NON_PYTH_COIN_NAMES },
      pythPriceServiceConfig: { endpoint: DEFAULT_PYTH_URL, config: {} },
      priceTimeout: 5_000,
      logger,
    } as unknown as PriceApiContext;
  };

  const payload = {
    prices: {
      '0x2::sui::SUI': {
        feed_id: FEED_B,
        price: '250000000',
        conf: '0',
        expo: -8,
        publish_time: 0,
        received_at: 0,
      },
      '0xs::sca::SCA': {
        feed_id: FEED_STALE,
        price: '900000000',
        conf: '0',
        expo: -8,
        publish_time: 0,
        received_at: 0,
      },
    },
    data: { encoding: 'base64', data: ['abc'] },
    updatedAt: 0,
  };

  it('skips a coin moved off pyth even though the payload still carries its coinType', async () => {
    // intent: the indexer keeps serving SCA's old pyth feed; returning it would
    // hand callers a price the protocol no longer uses.
    const prices = await getPythPricesFromIndexerApi(indexerCtx(payload), [
      'sui',
      'sca',
    ]);

    expect(prices).toEqual({ sui: 2.5, sca: 0 });
  });
});

describe('getPricesFromIndexer', () => {
  const marketsCtx = () => {
    const queryClient = new QueryClient();
    return {
      fetchWithCache: createFetchWithCache(queryClient, logger),
      indexer: {
        url: 'mock://indexer',
        get: vi.fn().mockResolvedValue({
          pools: [{ coinName: 'sui', coinPrice: 2.5 }],
          collaterals: [],
        }),
      },
    } as never;
  };

  it('returns a DENSE record, zeroing coins with no lending pool', async () => {
    // intent: a sparse record leaves callers with `undefined`, which becomes NaN
    // in downstream arithmetic instead of a harmless 0.
    const prices = await getPricesFromIndexer(marketsCtx(), {
      coinNames: ['sui', 'collateralonly'],
    });

    expect(prices).toEqual({ sui: 2.5, collateralonly: 0 });
  });
});

describe('getCoingeckoPrices', () => {
  const geckoCtx = (get: ReturnType<typeof vi.fn>) => {
    const queryClient = new QueryClient();
    return {
      fetchWithCache: createFetchWithCache(queryClient, logger),
      indexer: { url: 'mock://indexer', get },
      metadata: { addresses, nonPythCoinNames: NON_PYTH_COIN_NAMES },
      priceTimeout: 5_000,
      logger,
    } as unknown as PriceApiContext;
  };

  it("reads SCA from the indexer's CoinGecko passthrough", async () => {
    const get = vi.fn().mockResolvedValue({ usd: 0.5 });
    const prices = await getCoingeckoPrices(geckoCtx(get), ['sca']);

    expect(prices).toEqual({ sca: 0.5 });
    expect(get).toHaveBeenCalledWith('/api/price/coingecko?id=scallop-2');
  });

  it('degrades to 0 instead of throwing when the read fails', async () => {
    // intent: CoinGecko is SCA's ONLY source — a failure there must not take
    // down the whole multi-coin price read.
    const get = vi.fn().mockRejectedValue(new Error('gecko down'));
    const prices = await getCoingeckoPrices(geckoCtx(get), ['sca']);

    expect(prices).toEqual({ sca: 0 });
  });

  it('resolves a coin with no configured CoinGecko id to 0', async () => {
    const get = vi.fn();
    const prices = await getCoingeckoPrices(geckoCtx(get), ['unmapped']);

    expect(prices).toEqual({ unmapped: 0 });
    expect(get).not.toHaveBeenCalled();
  });
});
