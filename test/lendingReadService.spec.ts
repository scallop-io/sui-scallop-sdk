import { describe, expect, it, vi, beforeEach } from 'vitest';
import { noopLogger } from 'src/logger/index.js';

vi.mock('src/queries/portfolioQuery.js', async () => {
  const actual = await vi.importActual<
    typeof import('src/queries/portfolioQuery.js')
  >('src/queries/portfolioQuery.js');
  return {
    ...actual,
    getLendings: vi.fn(async () => ({ sui: { coinName: 'sui' } })),
    getLending: vi.fn(async () => ({ coinName: 'sui' })),
  };
});

import { LendingReadService } from 'src/services/query/LendingReadService.js';
import * as portfolioQuery from 'src/queries/portfolioQuery.js';

const makeQuery = () =>
  ({
    utils: { logger: noopLogger },
  }) as never;

describe('LendingReadService', () => {
  beforeEach(() => {
    vi.mocked(portfolioQuery.getLendings).mockClear();
    vi.mocked(portfolioQuery.getLending).mockClear();
  });

  it('getLendings(source: rpc) passes indexer=false through', async () => {
    const service = new LendingReadService({ query: makeQuery() });
    await service.getLendings(['sui'], '0xowner', { source: 'rpc' });
    const args = vi.mocked(portfolioQuery.getLendings).mock.calls[0];
    expect(args[1]).toEqual(['sui']);
    expect(args[2]).toBe('0xowner');
    expect(args[5]).toBe(false);
  });

  it('getLendings(source: indexer) passes indexer=true through', async () => {
    const service = new LendingReadService({ query: makeQuery() });
    await service.getLendings(undefined, '0xowner', { source: 'indexer' });
    expect(vi.mocked(portfolioQuery.getLendings).mock.calls[0][5]).toBe(true);
  });

  it('getLendings(source: indexer-first) falls back to rpc on indexer failure', async () => {
    vi.mocked(portfolioQuery.getLendings).mockImplementationOnce(async () => {
      throw new Error('indexer boom');
    });
    const service = new LendingReadService({ query: makeQuery() });
    await service.getLendings(['sui'], '0xowner', { source: 'indexer-first' });
    expect(portfolioQuery.getLendings).toHaveBeenCalledTimes(2);
    expect(vi.mocked(portfolioQuery.getLendings).mock.calls[0][5]).toBe(true);
    expect(vi.mocked(portfolioQuery.getLendings).mock.calls[1][5]).toBe(false);
  });

  it('getLending delegates with the supplied pool-coin name + owner', async () => {
    const service = new LendingReadService({ query: makeQuery() });
    await service.getLending('sui', '0xowner', { source: 'rpc' });
    const args = vi.mocked(portfolioQuery.getLending).mock.calls[0];
    expect(args[1]).toBe('sui');
    expect(args[2]).toBe('0xowner');
    expect(args[3]).toBe(false);
  });
});
