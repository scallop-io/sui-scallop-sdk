import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helpers.js', () => ({
  getPythPricesFromApi: vi.fn(),
  getPythPricesFromOnChain: vi.fn(),
}));

import * as helpers from './helpers.js';
import { PriceRepository } from './index.js';
import { DEFAULT_PYTH_URL } from './const.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { PriceRepositoryMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as PriceRepositoryMetadata;
const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };

const makeRepo = () =>
  new PriceRepository({ onchain, metadata, logger: logger as never });

beforeEach(() => vi.clearAllMocks());

describe('PriceRepository', () => {
  it('defaults the pyth config (endpoint) onto the context when none is provided', () => {
    // intent: a missing pythPriceServiceConfig must not leave the context without an endpoint
    vi.mocked(helpers.getPythPricesFromApi).mockResolvedValue({} as never);
    makeRepo().getPricesFromPyth({ coinNames: ['sui'], source: 'api' });
    const ctx = vi.mocked(helpers.getPythPricesFromApi).mock.calls[0][0];
    expect(ctx.metadata).toBe(metadata);
    expect(ctx.pythPriceServiceConfig.endpoint).toBe(DEFAULT_PYTH_URL);
  });

  it('forwards coinNames as a bare array to the chosen helper', () => {
    vi.mocked(helpers.getPythPricesFromApi).mockResolvedValue({} as never);
    makeRepo().getPricesFromPyth({ coinNames: ['sui', 'usdc'], source: 'api' });
    expect(vi.mocked(helpers.getPythPricesFromApi).mock.calls[0][1]).toEqual([
      'sui',
      'usdc',
    ]);
  });

  it("defaults to 'api-first' and falls back to onchain when pyth api throws", async () => {
    vi.mocked(helpers.getPythPricesFromApi).mockRejectedValue(
      new Error('pyth down')
    );
    vi.mocked(helpers.getPythPricesFromOnChain).mockResolvedValue(
      'CHAIN' as never
    );
    const res = await makeRepo().getPricesFromPyth({ coinNames: ['sui'] });
    expect(res).toBe('CHAIN');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
