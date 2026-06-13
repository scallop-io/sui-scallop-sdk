import { describe, expect, it, vi, beforeEach } from 'vitest';
import { noopLogger } from 'src/logger/index.js';

vi.mock('src/queries/borrowIncentiveQuery.js', async () => {
  const actual = await vi.importActual<
    typeof import('src/queries/borrowIncentiveQuery.js')
  >('src/queries/borrowIncentiveQuery.js');
  return {
    ...actual,
    getBorrowIncentivePools: vi.fn(async () => ({ sui: { coinName: 'sui' } })),
  };
});

import { BorrowIncentiveService } from 'src/services/query/BorrowIncentiveService.js';
import * as borrowIncentiveQuery from 'src/queries/borrowIncentiveQuery.js';

const makeQuery = () =>
  ({
    constants: { whitelist: { lending: new Set<string>(['sui']) } },
    utils: { logger: noopLogger },
  }) as never;

describe('BorrowIncentiveService', () => {
  beforeEach(() => {
    vi.mocked(borrowIncentiveQuery.getBorrowIncentivePools).mockClear();
  });

  it('defaults coin names to lending whitelist when none supplied', async () => {
    const service = new BorrowIncentiveService({ query: makeQuery() });
    await service.getBorrowIncentivePools(undefined, { source: 'rpc' });
    const args = vi.mocked(borrowIncentiveQuery.getBorrowIncentivePools).mock
      .calls[0];
    expect(args[1]).toEqual(['sui']);
    expect(args[2]).toBe(false);
  });

  it('passes indexer=true on source: indexer', async () => {
    const service = new BorrowIncentiveService({ query: makeQuery() });
    await service.getBorrowIncentivePools(['sui'], { source: 'indexer' });
    expect(
      vi.mocked(borrowIncentiveQuery.getBorrowIncentivePools).mock.calls[0][2]
    ).toBe(true);
  });

  it('indexer-first falls back to rpc on failure', async () => {
    vi.mocked(
      borrowIncentiveQuery.getBorrowIncentivePools
    ).mockImplementationOnce(async () => {
      throw new Error('indexer boom');
    });
    const service = new BorrowIncentiveService({ query: makeQuery() });
    await service.getBorrowIncentivePools(['sui'], { source: 'indexer-first' });
    expect(borrowIncentiveQuery.getBorrowIncentivePools).toHaveBeenCalledTimes(
      2
    );
    expect(
      vi.mocked(borrowIncentiveQuery.getBorrowIncentivePools).mock.calls[0][2]
    ).toBe(true);
    expect(
      vi.mocked(borrowIncentiveQuery.getBorrowIncentivePools).mock.calls[1][2]
    ).toBe(false);
  });
});
