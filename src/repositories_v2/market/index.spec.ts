import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the helper module so these tests exercise ONLY the repository's own
// responsibilities: context assembly, source routing, and delegation — never the
// real RPC/indexer I/O the helpers perform.
vi.mock('./helpers.js', () => ({
  getMarketsFromIndexer: vi.fn(),
  getMarketsFromOnChain: vi.fn(),
  getMarketFromIndexer: vi.fn(),
  getMarketFromOnChain: vi.fn(),
}));

import * as helpers from './helpers.js';
import { MarketRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { IndexerDataSource } from 'src/datasources/indexer.js';
import type { MarketRepoAddressConfig, MarketRepoMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const indexer = {} as unknown as IndexerDataSource;
const addresses = { market: '0xMARKET' } as unknown as MarketRepoAddressConfig;
const metadata = { tag: 'META' } as unknown as MarketRepoMetadata;
const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };

const makeRepo = () =>
  new MarketRepository({
    onchain,
    indexer,
    addresses,
    metadata,
    logger: logger as never,
  });

const indexerFn = vi.mocked(helpers.getMarketsFromIndexer);
const onchainFn = vi.mocked(helpers.getMarketsFromOnChain);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MarketRepository', () => {
  describe('context assembly', () => {
    it('merges baseContext (onchain/fetchWithCache/logger) with indexer/addresses/metadata', () => {
      // intent: helpers receive everything they need via ctx; a dropped field silently breaks every read
      indexerFn.mockResolvedValue('OK' as never);
      makeRepo().getMarkets({ coinPrices: {}, source: 'api' });

      // the helper's param type is narrower than the runtime context, so assert
      // the assembled shape structurally
      const ctx = indexerFn.mock.calls[0][0] as unknown as Record<
        string,
        unknown
      >;
      expect(ctx.onchain).toBe(onchain);
      expect(ctx.indexer).toBe(indexer);
      expect(ctx.addresses).toBe(addresses);
      expect(ctx.metadata).toBe(metadata);
      expect(typeof ctx.fetchWithCache).toBe('function');
    });
  });

  describe('source routing', () => {
    it("source: 'api' calls the indexer helper only", async () => {
      indexerFn.mockResolvedValue('API' as never);
      const res = await makeRepo().getMarkets({
        coinPrices: {},
        source: 'api',
      });
      expect(res).toBe('API');
      expect(indexerFn).toHaveBeenCalledTimes(1);
      expect(onchainFn).not.toHaveBeenCalled();
    });

    it("source: 'onchain' calls the onchain helper only", async () => {
      onchainFn.mockResolvedValue('CHAIN' as never);
      const res = await makeRepo().getMarkets({
        coinPrices: {},
        source: 'onchain',
      });
      expect(res).toBe('CHAIN');
      expect(onchainFn).toHaveBeenCalledTimes(1);
      expect(indexerFn).not.toHaveBeenCalled();
    });

    it("defaults to 'api-first' and falls back to onchain when the indexer throws", async () => {
      // intent: the indexer is best-effort; a transient indexer failure must not break reads
      indexerFn.mockRejectedValue(new Error('indexer down'));
      onchainFn.mockResolvedValue('FALLBACK' as never);

      const res = await makeRepo().getMarkets({ coinPrices: {} });

      expect(res).toBe('FALLBACK');
      expect(indexerFn).toHaveBeenCalledTimes(1);
      expect(onchainFn).toHaveBeenCalledTimes(1);
      // the fallback must be observable, not silent
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('delegation', () => {
    it('forwards the coinPrices option through to the chosen helper', () => {
      indexerFn.mockResolvedValue('OK' as never);
      const coinPrices = { sui: 2 };
      makeRepo().getMarkets({ coinPrices, source: 'api' });
      expect(indexerFn.mock.calls[0][1]).toEqual({ coinPrices });
    });
  });
});
