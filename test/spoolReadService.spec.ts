import { describe, expect, it, vi, beforeEach } from 'vitest';
import { noopLogger } from 'src/logger/index.js';

vi.mock('src/queries/spoolQuery.js', async () => {
  const actual = await vi.importActual<
    typeof import('src/queries/spoolQuery.js')
  >('src/queries/spoolQuery.js');
  return {
    ...actual,
    getSpools: vi.fn(async () => ({ ssui: { marketCoinName: 'ssui' } })),
    getSpool: vi.fn(async () => ({ marketCoinName: 'ssui' })),
  };
});

import { SpoolReadService } from 'src/services/SpoolReadService.js';
import * as spoolQuery from 'src/queries/spoolQuery.js';

const makeQuery = () =>
  ({
    constants: { whitelist: { spool: new Set<string>(['ssui']) } },
    utils: { logger: noopLogger },
  }) as never;

describe('SpoolReadService', () => {
  beforeEach(() => {
    vi.mocked(spoolQuery.getSpools).mockClear();
    vi.mocked(spoolQuery.getSpool).mockClear();
  });

  it('getSpools(source: rpc) passes indexer=false through', async () => {
    const service = new SpoolReadService({ query: makeQuery() });
    await service.getSpools(['ssui'], { source: 'rpc' });
    const args = vi.mocked(spoolQuery.getSpools).mock.calls[0];
    expect(args[1]).toEqual(['ssui']);
    expect(args[2]).toBe(false);
  });

  it('getSpools(source: indexer) passes indexer=true through', async () => {
    const service = new SpoolReadService({ query: makeQuery() });
    await service.getSpools(['ssui'], { source: 'indexer' });
    expect(vi.mocked(spoolQuery.getSpools).mock.calls[0][2]).toBe(true);
  });

  it('getSpools(source: indexer-first) falls back to rpc on indexer failure', async () => {
    vi.mocked(spoolQuery.getSpools).mockImplementationOnce(async () => {
      throw new Error('indexer boom');
    });
    const service = new SpoolReadService({ query: makeQuery() });
    await service.getSpools(['ssui'], { source: 'indexer-first' });
    expect(spoolQuery.getSpools).toHaveBeenCalledTimes(2);
    expect(vi.mocked(spoolQuery.getSpools).mock.calls[0][2]).toBe(true);
    expect(vi.mocked(spoolQuery.getSpools).mock.calls[1][2]).toBe(false);
  });

  it('getSpool delegates with the supplied market-coin name', async () => {
    const service = new SpoolReadService({ query: makeQuery() });
    await service.getSpool('ssui', { source: 'rpc' });
    const args = vi.mocked(spoolQuery.getSpool).mock.calls[0];
    expect(args[1]).toBe('ssui');
    expect(args[2]).toBe(false);
  });
});
