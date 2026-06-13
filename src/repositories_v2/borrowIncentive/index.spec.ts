import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helpers.js', () => ({
  getBorrowIncentivePoolsFromOnChain: vi.fn(),
  getBorrowIncentiveAccountsFromOnChain: vi.fn(),
}));

import * as helpers from './helpers.js';
import { BorrowIncentiveRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type {
  BorrowIncentiveAddressConfig,
  BorrowIncentiveMetadata,
} from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const addresses = {
  obligation: '0xO',
} as unknown as BorrowIncentiveAddressConfig;
const metadata = { tag: 'META' } as unknown as BorrowIncentiveMetadata;

const makeRepo = () =>
  new BorrowIncentiveRepository({ onchain, addresses, metadata });

beforeEach(() => vi.clearAllMocks());

describe('BorrowIncentiveRepository', () => {
  it('carries addresses and metadata on the context', () => {
    vi.mocked(helpers.getBorrowIncentivePoolsFromOnChain).mockResolvedValue(
      {} as never
    );
    makeRepo().getBorrowIncentivePools({ coinPrices: {} });
    const ctx = vi.mocked(helpers.getBorrowIncentivePoolsFromOnChain).mock
      .calls[0][0];
    expect(ctx.addresses).toBe(addresses);
    expect(ctx.metadata).toBe(metadata);
  });

  it('getBorrowIncentivePools forwards its read args verbatim', () => {
    vi.mocked(helpers.getBorrowIncentivePoolsFromOnChain).mockResolvedValue(
      {} as never
    );
    const args = { coinPrices: { sui: 2 }, coinNames: ['sui'] };
    makeRepo().getBorrowIncentivePools(args);
    expect(
      vi.mocked(helpers.getBorrowIncentivePoolsFromOnChain).mock.calls[0][1]
    ).toEqual(args);
  });

  it('getBorrowIncentiveAccounts forwards { obligationId, coinNames }', () => {
    vi.mocked(helpers.getBorrowIncentiveAccountsFromOnChain).mockResolvedValue(
      {} as never
    );
    makeRepo().getBorrowIncentiveAccounts({
      obligationId: '0xOB',
      coinNames: ['sui'],
    });
    expect(
      vi.mocked(helpers.getBorrowIncentiveAccountsFromOnChain).mock.calls[0][1]
    ).toEqual({ obligationId: '0xOB', coinNames: ['sui'] });
  });
});
