import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock helpers — assert the repository delegates to the right onchain helper with
// the right (context, args), without performing real coin-balance RPC reads.
vi.mock('src/repositories/coinBalance/helpers.js', () => ({
  getCoinAmountFromOnChain: vi.fn(),
  getCoinAmountsFromOnChain: vi.fn(),
  getCoinBalancesFromGraphQL: vi.fn(),
  getSCoinAmountsFromOnChain: vi.fn(),
  getSCoinAmountFromOnChain: vi.fn(),
  querySCoinTotalSupplyFromOnChain: vi.fn(),
  getMarketCoinAmountsFromOnChain: vi.fn(),
  getMarketCoinAmountFromOnChain: vi.fn(),
}));

import * as helpers from 'src/repositories/coinBalance/helpers.js';
import { CoinBalanceRepository } from 'src/repositories/coinBalance/index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { GraphQLDataSource } from 'src/datasources/graphql.js';
import type { CoinBalanceMetadata } from 'src/repositories/coinBalance/types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const balanceSource = {
  url: 'mock://graphql',
  multiGetBalances: vi.fn(),
} as unknown as GraphQLDataSource;
const metadata = { tag: 'META' } as unknown as CoinBalanceMetadata;

const makeRepo = () =>
  new CoinBalanceRepository({
    onchain,
    balanceSource,
    metadata,
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CoinBalanceRepository', () => {
  it('exposes the injected metadata and base datasource on its context', () => {
    // intent: a CoinBalanceRepoParams guarantees metadata; the getter must surface it (regression for the `?? {}` bug)
    vi.mocked(helpers.getCoinAmountsFromOnChain).mockResolvedValue({} as never);
    makeRepo().getCoinAmounts({ address: '0xA' });

    const ctx = vi.mocked(helpers.getCoinAmountsFromOnChain).mock.calls[0][0];
    expect(ctx.metadata).toBe(metadata);
    expect(ctx.onchain).toBe(onchain);
    expect(ctx.balanceSource).toBe(balanceSource);
    expect(typeof ctx.fetchWithCache).toBe('function');
  });

  it('getCoinBalances delegates to the GraphQL helper with { coinTypes, address } and the balance datasource', () => {
    vi.mocked(helpers.getCoinBalancesFromGraphQL).mockResolvedValue(
      {} as never
    );
    makeRepo().getCoinBalances({
      coinTypes: ['0x2::sui::SUI'],
      address: '0xA',
    });

    const [ctx, args] = vi.mocked(helpers.getCoinBalancesFromGraphQL).mock
      .calls[0];
    expect(ctx.balanceSource).toBe(balanceSource);
    expect(args).toEqual({ coinTypes: ['0x2::sui::SUI'], address: '0xA' });
  });

  it('getCoinAmounts delegates with { coinNames, address }', () => {
    vi.mocked(helpers.getCoinAmountsFromOnChain).mockResolvedValue({} as never);
    makeRepo().getCoinAmounts({ coinNames: ['sui'], address: '0xA' });
    expect(
      vi.mocked(helpers.getCoinAmountsFromOnChain).mock.calls[0][1]
    ).toEqual({ coinNames: ['sui'], address: '0xA' });
  });

  it('getSCoinAmount delegates with { sCoinName, address }', () => {
    vi.mocked(helpers.getSCoinAmountFromOnChain).mockResolvedValue(0 as never);
    makeRepo().getSCoinAmount({ sCoinName: 'ssui', address: '0xA' });
    expect(
      vi.mocked(helpers.getSCoinAmountFromOnChain).mock.calls[0][1]
    ).toEqual({ sCoinName: 'ssui', address: '0xA' });
  });

  it('getSCoinTotalSupply delegates the bare sCoinName argument', () => {
    vi.mocked(helpers.querySCoinTotalSupplyFromOnChain).mockResolvedValue(
      0 as never
    );
    makeRepo().getSCoinTotalSupply('ssui');
    expect(
      vi.mocked(helpers.querySCoinTotalSupplyFromOnChain).mock.calls[0][1]
    ).toBe('ssui');
  });

  it('returns the helper result unchanged (no post-processing in the repo)', async () => {
    vi.mocked(helpers.getMarketCoinAmountFromOnChain).mockResolvedValue(
      123 as never
    );
    const res = await makeRepo().getMarketCoinAmount({
      marketCoinName: 'ssui',
      address: '0xA',
    });
    expect(res).toBe(123);
  });
});
