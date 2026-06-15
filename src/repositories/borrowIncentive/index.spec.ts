import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helpers.js', () => ({
  getBorrowIncentivePoolsFromOnChain: vi.fn(),
  getBorrowIncentiveAccountsFromOnChain: vi.fn(),
  getBindedVeScaKeyByObligationIdFromOnChain: vi.fn(),
  getBindedObligation: vi.fn(),
}));

import * as helpers from './helpers.js';
import { BorrowIncentiveRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { BorrowIncentiveMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as BorrowIncentiveMetadata;

const makeRepo = () => new BorrowIncentiveRepository({ onchain, metadata });

beforeEach(() => vi.clearAllMocks());

describe('BorrowIncentiveRepository', () => {
  it('carries metadata (with its nested addresses) on the context', () => {
    vi.mocked(helpers.getBorrowIncentivePoolsFromOnChain).mockResolvedValue(
      {} as never
    );
    makeRepo().getBorrowIncentivePools({ coinPrices: {} });
    const ctx = vi.mocked(helpers.getBorrowIncentivePoolsFromOnChain).mock
      .calls[0][0];
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

  it('getBindedVeScaKey passes the bare obligationId', () => {
    vi.mocked(
      helpers.getBindedVeScaKeyByObligationIdFromOnChain
    ).mockResolvedValue(null as never);
    makeRepo().getBindedVeScaKey('0xOB');
    expect(
      vi.mocked(helpers.getBindedVeScaKeyByObligationIdFromOnChain).mock
        .calls[0][1]
    ).toBe('0xOB');
  });

  it('getBindedObligation passes the bare veScaKey', () => {
    vi.mocked(helpers.getBindedObligation).mockResolvedValue(null as never);
    makeRepo().getBindedObligation('0xKEY');
    expect(vi.mocked(helpers.getBindedObligation).mock.calls[0][1]).toBe(
      '0xKEY'
    );
  });
});
