import { describe, expect, it, vi, beforeEach } from 'vitest';
import { noopLogger } from 'src/logger/index.js';

// Mock both query modules. `coreQuery` hosts the RPC-only obligation reads
// (`getObligations`, `queryObligation`); `portfolioQuery` hosts the three
// source-switchable `getObligationAccount*` reads.
vi.mock('src/queries/coreQuery.js', async () => {
  const actual = await vi.importActual<
    typeof import('src/queries/coreQuery.js')
  >('src/queries/coreQuery.js');
  return {
    ...actual,
    getObligations: vi.fn(async () => [{ id: '0xobligation', keyId: '0xkey' }]),
    queryObligation: vi.fn(async () => ({ obligationId: '0xobligation' })),
  };
});

vi.mock('src/queries/portfolioQuery.js', async () => {
  const actual = await vi.importActual<
    typeof import('src/queries/portfolioQuery.js')
  >('src/queries/portfolioQuery.js');
  return {
    ...actual,
    getObligationAccounts: vi.fn(async () => ({ '0xkey': { rpc: true } })),
    getObligationAccountsByIds: vi.fn(async () => [{ rpc: true }]),
    getObligationAccount: vi.fn(async () => ({ rpc: true })),
  };
});

import { ObligationService } from 'src/services/query/ObligationService.js';
import * as coreQuery from 'src/queries/coreQuery.js';
import * as portfolioQuery from 'src/queries/portfolioQuery.js';

const makeQuery = () =>
  ({
    utils: { logger: noopLogger },
  }) as never;

describe('ObligationService', () => {
  beforeEach(() => {
    vi.mocked(coreQuery.getObligations).mockClear();
    vi.mocked(coreQuery.queryObligation).mockClear();
    vi.mocked(portfolioQuery.getObligationAccounts).mockClear();
    vi.mocked(portfolioQuery.getObligationAccountsByIds).mockClear();
    vi.mocked(portfolioQuery.getObligationAccount).mockClear();
  });

  it('getObligations delegates to coreQuery.getObligations', async () => {
    const service = new ObligationService({ query: makeQuery() });
    await service.getObligations('0xowner');
    expect(coreQuery.getObligations).toHaveBeenCalledOnce();
    expect(vi.mocked(coreQuery.getObligations).mock.calls[0][1]).toBe(
      '0xowner'
    );
  });

  it('queryObligation delegates to coreQuery.queryObligation', async () => {
    const service = new ObligationService({ query: makeQuery() });
    await service.queryObligation('0xobligation');
    expect(coreQuery.queryObligation).toHaveBeenCalledOnce();
    expect(vi.mocked(coreQuery.queryObligation).mock.calls[0][1]).toBe(
      '0xobligation'
    );
  });

  it('getObligationAccounts(source: rpc) calls portfolioQuery with indexer=false', async () => {
    const service = new ObligationService({ query: makeQuery() });
    await service.getObligationAccounts('0xowner', { source: 'rpc' });
    expect(portfolioQuery.getObligationAccounts).toHaveBeenCalledOnce();
    const args = vi.mocked(portfolioQuery.getObligationAccounts).mock.calls[0];
    expect(args[1]).toBe('0xowner');
    expect(args[4]).toBe(false);
  });

  it('getObligationAccounts(source: indexer) calls portfolioQuery with indexer=true', async () => {
    const service = new ObligationService({ query: makeQuery() });
    await service.getObligationAccounts('0xowner', { source: 'indexer' });
    const args = vi.mocked(portfolioQuery.getObligationAccounts).mock.calls[0];
    expect(args[4]).toBe(true);
  });

  it('getObligationAccounts(source: indexer-first) falls back to rpc on indexer failure', async () => {
    vi.mocked(portfolioQuery.getObligationAccounts).mockImplementationOnce(
      async () => {
        throw new Error('indexer boom');
      }
    );
    const service = new ObligationService({ query: makeQuery() });
    await service.getObligationAccounts('0xowner', { source: 'indexer-first' });
    expect(portfolioQuery.getObligationAccounts).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(portfolioQuery.getObligationAccounts).mock.calls[0][4]
    ).toBe(true);
    expect(
      vi.mocked(portfolioQuery.getObligationAccounts).mock.calls[1][4]
    ).toBe(false);
  });

  it('getObligationAccountsByIds passes obligationIds through', async () => {
    const service = new ObligationService({ query: makeQuery() });
    await service.getObligationAccountsByIds(['0xa', '0xb'], { source: 'rpc' });
    const args = vi.mocked(portfolioQuery.getObligationAccountsByIds).mock
      .calls[0];
    expect(args[1]).toEqual(['0xa', '0xb']);
    expect(args[4]).toBe(false);
  });

  it('getObligationAccountById uses the obligationId and passes an empty coinAmounts map', async () => {
    const service = new ObligationService({ query: makeQuery() });
    await service.getObligationAccountById('0xobligation', { source: 'rpc' });
    const args = vi.mocked(portfolioQuery.getObligationAccount).mock.calls[0];
    expect(args[1]).toBe('0xobligation');
    expect(args[2]).toBe('');
    expect(args[3]).toBe(false);
    expect(args[6]).toEqual({});
  });
});
