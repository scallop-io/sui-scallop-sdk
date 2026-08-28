import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/repositories/price/helpers.js', () => ({
  getPythPricesFromPythApi: vi.fn(),
  getPythPricesFromIndexerApi: vi.fn(),
  getPythPricesFromOnChain: vi.fn(),
  getPythFeedObjectFromOnChain: vi.fn(),
  getPythFeedObjectsFromOnChain: vi.fn(),
  getPricesFromIndexer: vi.fn(),
  getCoingeckoPrices: vi.fn(),
}));

import * as helpers from 'src/repositories/price/helpers.js';
import { PriceRepository } from 'src/repositories/price/index.js';
import { DEFAULT_PYTH_URL } from 'src/repositories/price/const.js';
import type { GrpcDataSource } from 'src/datasources/grpc.js';
import type { PriceRepositoryMetadata } from 'src/repositories/price/types.js';
import { IndexerDataSource } from 'src/datasources/indexer.js';

const onchain = { url: 'mock://node' } as unknown as GrpcDataSource;
const indexer = {} as unknown as IndexerDataSource;
// `sca` migrated off pyth (custom oracle) — its price comes from CoinGecko.
const metadata = {
  tag: 'META',
  nonPythCoinNames: new Set(['sca']),
} as unknown as PriceRepositoryMetadata;
const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };

const makeRepo = (pythApiKey?: string) =>
  new PriceRepository({
    grpc: onchain,
    indexer,
    metadata,
    logger: logger as never,
    pythApiKey,
  });

beforeEach(() => vi.clearAllMocks());

describe('PriceRepository', () => {
  it('defaults the pyth config (endpoint) onto the context when none is provided', async () => {
    // intent: a missing pythPriceServiceConfig must not leave the context without an endpoint
    vi.mocked(helpers.getPythPricesFromIndexerApi).mockResolvedValue(
      {} as never
    );
    await makeRepo().getPricesFromPyth({ coinNames: ['sui'], source: 'api' });
    const ctx = vi.mocked(helpers.getPythPricesFromIndexerApi).mock.calls[0][0];
    expect(ctx.metadata).toBe(metadata);
    expect(ctx.pythPriceServiceConfig.endpoint).toBe(DEFAULT_PYTH_URL);
  });

  it('forwards coinNames as a bare array to the chosen helper', async () => {
    vi.mocked(helpers.getPythPricesFromIndexerApi).mockResolvedValue(
      {} as never
    );
    await makeRepo().getPricesFromPyth({
      coinNames: ['sui', 'usdc'],
      source: 'api',
    });
    expect(
      vi.mocked(helpers.getPythPricesFromIndexerApi).mock.calls[0][1]
    ).toEqual(['sui', 'usdc']);
  });

  it("defaults to 'api-first' and falls back to onchain when the api source throws", async () => {
    vi.mocked(helpers.getPythPricesFromIndexerApi).mockRejectedValue(
      new Error('indexer down')
    );
    vi.mocked(helpers.getPythPricesFromOnChain).mockResolvedValue({
      sui: 2.5,
    } as never);
    const res = await makeRepo().getPricesFromPyth({ coinNames: ['sui'] });
    expect(res).toEqual({ sui: 2.5 });
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  describe('coins routed off pyth', () => {
    it('prices them from CoinGecko and keeps them out of the pyth read', async () => {
      // intent: SCA's `oracle.pyth` feed is stale after the custom-oracle
      // migration — sending it to pyth would return a price that no longer
      // backs the protocol.
      vi.mocked(helpers.getPythPricesFromIndexerApi).mockResolvedValue({
        sui: 2.5,
      } as never);
      vi.mocked(helpers.getCoingeckoPrices).mockResolvedValue({
        sca: 0.5,
      } as never);

      const res = await makeRepo().getPricesFromPyth({
        coinNames: ['sui', 'sca'],
        source: 'api',
      });

      expect(res).toEqual({ sui: 2.5, sca: 0.5 });
      expect(
        vi.mocked(helpers.getPythPricesFromIndexerApi).mock.calls[0][1]
      ).toEqual(['sui']);
      expect(vi.mocked(helpers.getCoingeckoPrices).mock.calls[0][1]).toEqual([
        'sca',
      ]);
    });

    it('skips the pyth read entirely when every requested coin is off pyth', async () => {
      vi.mocked(helpers.getCoingeckoPrices).mockResolvedValue({
        sca: 0.5,
      } as never);

      const res = await makeRepo().getPricesFromPyth({ coinNames: ['sca'] });

      expect(res).toEqual({ sca: 0.5 });
      expect(helpers.getPythPricesFromIndexerApi).not.toHaveBeenCalled();
      expect(helpers.getPythPricesFromOnChain).not.toHaveBeenCalled();
    });
  });

  describe('api source selection by pythApiKey', () => {
    it('reads from the Scallop indexer (not Pyth) when no api key is set', async () => {
      // intent: without a key the SDK must not hit the paid Pyth endpoint
      vi.mocked(helpers.getPythPricesFromIndexerApi).mockResolvedValue(
        {} as never
      );
      await makeRepo().getPricesFromPyth({ coinNames: ['sui'], source: 'api' });
      expect(helpers.getPythPricesFromIndexerApi).toHaveBeenCalledTimes(1);
      expect(helpers.getPythPricesFromPythApi).not.toHaveBeenCalled();
    });

    it('reads directly from the Pyth api when an api key is set', async () => {
      // intent: providing a key switches the read to the direct Pyth source
      vi.mocked(helpers.getPythPricesFromPythApi).mockResolvedValue(
        {} as never
      );
      await makeRepo('secret-key').getPricesFromPyth({
        coinNames: ['sui'],
        source: 'api',
      });
      expect(helpers.getPythPricesFromPythApi).toHaveBeenCalledTimes(1);
      expect(helpers.getPythPricesFromIndexerApi).not.toHaveBeenCalled();
    });

    it('injects the api key as the Hermes accessToken and exposes it on the context', async () => {
      // intent: the key must actually authenticate the direct Pyth read
      vi.mocked(helpers.getPythPricesFromPythApi).mockResolvedValue(
        {} as never
      );
      await makeRepo('secret-key').getPricesFromPyth({
        coinNames: ['sui'],
        source: 'api',
      });
      const ctx = vi.mocked(helpers.getPythPricesFromPythApi).mock.calls[0][0];
      expect(ctx.pythApiKey).toBe('secret-key');
      expect(ctx.pythPriceServiceConfig.config.accessToken).toBe('secret-key');
    });

    it('leaves accessToken unset when no api key is provided', async () => {
      vi.mocked(helpers.getPythPricesFromIndexerApi).mockResolvedValue(
        {} as never
      );
      await makeRepo().getPricesFromPyth({ coinNames: ['sui'], source: 'api' });
      const ctx = vi.mocked(helpers.getPythPricesFromIndexerApi).mock
        .calls[0][0];
      expect(ctx.pythApiKey).toBeUndefined();
      expect(ctx.pythPriceServiceConfig.config.accessToken).toBeUndefined();
    });
  });
});
