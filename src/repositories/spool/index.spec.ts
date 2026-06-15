import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helpers.js', () => ({
  getSpoolFromIndexer: vi.fn(),
  getSpoolFromOnChain: vi.fn(),
  getSpoolRewardPoolsFromOnChain: vi.fn(),
  getSpoolsFromIndexer: vi.fn(),
  getSpoolsFromOnChain: vi.fn(),
  getStakeAccountsFromOnChain: vi.fn(),
  getStakePoolFromOnChain: vi.fn(),
}));

import * as helpers from './helpers.js';
import { SpoolRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { IndexerDataSource } from 'src/datasources/indexer.js';
import type { SpoolMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const indexer = {} as unknown as IndexerDataSource;
const metadata = { tag: 'META' } as unknown as SpoolMetadata;
const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };

const makeRepo = () =>
  new SpoolRepository({ onchain, indexer, metadata, logger: logger as never });

beforeEach(() => vi.clearAllMocks());

describe('SpoolRepository', () => {
  it('carries indexer + metadata on the context', () => {
    vi.mocked(helpers.getSpoolsFromIndexer).mockResolvedValue({} as never);
    makeRepo().getSpools({ coinPrices: {}, source: 'api' });
    const ctx = vi.mocked(helpers.getSpoolsFromIndexer).mock.calls[0][0];
    expect(ctx.indexer).toBe(indexer);
    expect(ctx.metadata).toBe(metadata);
  });

  describe('getSpools source routing', () => {
    it("'api-first' (default) falls back to onchain when the indexer throws", async () => {
      vi.mocked(helpers.getSpoolsFromIndexer).mockRejectedValue(
        new Error('down')
      );
      vi.mocked(helpers.getSpoolsFromOnChain).mockResolvedValue(
        'CHAIN' as never
      );
      const res = await makeRepo().getSpools({ coinPrices: {} });
      expect(res).toBe('CHAIN');
      expect(helpers.getSpoolsFromIndexer).toHaveBeenCalledTimes(1);
      expect(helpers.getSpoolsFromOnChain).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it("'onchain' skips the indexer entirely", async () => {
      vi.mocked(helpers.getSpoolsFromOnChain).mockResolvedValue(
        'CHAIN' as never
      );
      await makeRepo().getSpools({ coinPrices: {}, source: 'onchain' });
      expect(helpers.getSpoolsFromIndexer).not.toHaveBeenCalled();
    });
  });

  describe('derived helpers', () => {
    it('getSpoolRewardPool narrows the multi-pool result to the requested pool', async () => {
      // intent: the single-pool convenience must select by name, not return the whole map
      vi.mocked(helpers.getSpoolRewardPoolsFromOnChain).mockResolvedValue({
        ssui: 'SSUI_POOL',
        susdc: 'SUSDC_POOL',
      } as never);
      const res = await makeRepo().getSpoolRewardPool('ssui');
      expect(res).toBe('SSUI_POOL');
      expect(
        vi.mocked(helpers.getSpoolRewardPoolsFromOnChain).mock.calls[0][1]
      ).toEqual({ stakeCoinNames: ['ssui'] });
    });

    it('getStakeAccountsByPool returns [] when the pool has no accounts', async () => {
      // intent: a missing pool key must yield an empty array, never undefined
      vi.mocked(helpers.getStakeAccountsFromOnChain).mockResolvedValue(
        {} as never
      );
      const res = await makeRepo().getStakeAccountsByPool('0xA', 'ssui');
      expect(res).toEqual([]);
    });

    it('getStakePool delegates with the bare stakeCoinName', () => {
      vi.mocked(helpers.getStakePoolFromOnChain).mockResolvedValue(
        undefined as never
      );
      makeRepo().getStakePool('ssui');
      expect(vi.mocked(helpers.getStakePoolFromOnChain).mock.calls[0][1]).toBe(
        'ssui'
      );
    });
  });
});
