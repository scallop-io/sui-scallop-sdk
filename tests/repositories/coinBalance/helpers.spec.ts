import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/query-core';
import { createFetchWithCache } from 'src/utils/cache.js';
import { noopLogger } from 'src/logger/index.js';
import {
  getCoinAmountsFromOnChain,
  getSCoinAmountsFromOnChain,
  getMarketCoinAmountsFromOnChain,
} from 'src/repositories/coinBalance/helpers.js';
import type { CoinBalanceMetadata } from 'src/repositories/coinBalance/types.js';
import type { GrpcDataSource } from 'src/datasources/grpc.js';
import type { GraphQLDataSource } from 'src/datasources/graphql.js';

// A balance node in the transport shape listBalances returns.
const bal = (coinType: string, balance: string) => ({
  coinType,
  balance,
  coinBalance: balance,
  addressBalance: balance,
});

// Fake gRPC client: `listBalances` returns the given pages in order so the paging
// loop terminates. Records call count so we can assert the scan is shared.
const makeOnchain = (
  pages: Array<{
    balances: ReturnType<typeof bal>[];
    hasNextPage: boolean;
    cursor: string | null;
  }>,
  url = 'node://A'
) => {
  let callIndex = 0;
  const listBalances = vi.fn(
    async () => pages[Math.min(callIndex++, pages.length - 1)]
  );
  return {
    url,
    client: { listBalances },
  } as unknown as GrpcDataSource & {
    client: { listBalances: typeof listBalances };
  };
};

// preferGraphql=false forces the gRPC snapshot path; the GraphQL source is unused
// but the context requires it structurally.
const balanceSource = {
  url: 'gql://A',
  multiGetBalances: vi.fn(),
} as unknown as GraphQLDataSource;

const metadata = {
  whitelist: { lending: new Set(['sui']), scoin: new Set(['ssui']) },
  parseCoinType: (n: string) => `0x2::${n}::${n.toUpperCase()}`,
  parseSCoinType: (n: string) => `0xs::${n}::${n.toUpperCase()}`,
  parseMarketCoinType: (n: string) => `0xm::${n}::${n.toUpperCase()}`,
} as unknown as CoinBalanceMetadata;

const makeCtx = (grpc: GrpcDataSource) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  return {
    grpc,
    balanceSource,
    metadata,
    logger: noopLogger,
    preferGraphql: false,
    fetchWithCache: createFetchWithCache(queryClient, noopLogger),
  };
};

beforeEach(() => vi.clearAllMocks());

describe('coinBalance shared gRPC balance snapshot (Phase 1)', () => {
  it('three concurrent amount readers share ONE page sequence, not three', async () => {
    // intent: the P0 win — getCoinAmounts/getSCoinAmounts/getMarketCoinAmounts
    // for the same node+address must collapse to a single listBalances scan via
    // the shared getAllCoinBalances cache, instead of each re-scanning.
    const onchain = makeOnchain([
      {
        balances: [
          bal('0x2::sui::SUI', '10'),
          bal('0xs::ssui::SSUI', '20'),
          bal('0xm::ssui::SSUI', '30'),
        ],
        hasNextPage: false,
        cursor: null,
      },
    ]);
    const ctx = makeCtx(onchain);

    await Promise.all([
      getCoinAmountsFromOnChain(ctx, { coinNames: ['sui'], address: '0xA' }),
      getSCoinAmountsFromOnChain(ctx, { sCoinNames: ['ssui'], address: '0xA' }),
      getMarketCoinAmountsFromOnChain(ctx, {
        marketCoinNames: ['ssui'],
        address: '0xA',
      }),
    ]);

    expect(onchain.client.listBalances).toHaveBeenCalledTimes(1);
  });

  it('pages a two-page response into all balances', async () => {
    // intent: the cached snapshot must preserve the full paginated result, not
    // just page one — and the second reader is served from cache.
    const onchain = makeOnchain([
      {
        balances: [bal('0x2::sui::SUI', '10')],
        hasNextPage: true,
        cursor: 'c1',
      },
      {
        balances: [bal('0xs::ssui::SSUI', '20')],
        hasNextPage: false,
        cursor: null,
      },
    ]);
    const ctx = makeCtx(onchain);

    const coin = await getCoinAmountsFromOnChain(ctx, {
      coinNames: ['sui'],
      address: '0xA',
    });
    const scoin = await getSCoinAmountsFromOnChain(ctx, {
      sCoinNames: ['ssui'],
      address: '0xA',
    });

    expect(coin.sui).toBe(10);
    expect(scoin.ssui).toBe(20);
    // Two pages fetched once, then served from cache for the second reader.
    expect(onchain.client.listBalances).toHaveBeenCalledTimes(2);
  });

  it('does not share the snapshot across different addresses', async () => {
    // intent: the cache key is namespaced by address — a different wallet must
    // trigger its own scan.
    const onchain = makeOnchain([
      {
        balances: [bal('0x2::sui::SUI', '10')],
        hasNextPage: false,
        cursor: null,
      },
    ]);
    const ctx = makeCtx(onchain);

    await getCoinAmountsFromOnChain(ctx, {
      coinNames: ['sui'],
      address: '0xA',
    });
    await getCoinAmountsFromOnChain(ctx, {
      coinNames: ['sui'],
      address: '0xB',
    });

    expect(onchain.client.listBalances).toHaveBeenCalledTimes(2);
  });
});
