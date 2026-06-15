import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helpers.js', () => ({
  getPoolAddressesFromApi: vi.fn(),
  getPoolAddressesFromOnChain: vi.fn(),
}));

import * as helpers from './helpers.js';
import { PoolAddressesRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { PoolAddressesRepoMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as PoolAddressesRepoMetadata;
const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };

const makeRepo = () =>
  new PoolAddressesRepository({ onchain, metadata, logger: logger as never });

beforeEach(() => vi.clearAllMocks());

describe('PoolAddressesRepository', () => {
  it("defaults to source 'api' and forwards { poolNames } to the api helper", async () => {
    vi.mocked(helpers.getPoolAddressesFromApi).mockResolvedValue({} as never);

    await makeRepo().getPoolAddresses({ poolNames: ['sui'] });

    expect(helpers.getPoolAddressesFromApi).toHaveBeenCalledTimes(1);
    expect(helpers.getPoolAddressesFromOnChain).not.toHaveBeenCalled();
    expect(vi.mocked(helpers.getPoolAddressesFromApi).mock.calls[0][1]).toEqual(
      { poolNames: ['sui'] }
    );
  });

  it("source: 'onchain' rebuilds from chain, carrying api + metadata on the context", async () => {
    vi.mocked(helpers.getPoolAddressesFromOnChain).mockResolvedValue(
      {} as never
    );

    await makeRepo().getPoolAddresses({ source: 'onchain' });

    expect(helpers.getPoolAddressesFromOnChain).toHaveBeenCalledTimes(1);
    expect(helpers.getPoolAddressesFromApi).not.toHaveBeenCalled();
    const ctx = vi.mocked(helpers.getPoolAddressesFromOnChain).mock.calls[0][0];
    expect(ctx.metadata).toBe(metadata);
    expect(ctx.api).toBeDefined();
  });

  it("'api-first' falls back to onchain when the api throws", async () => {
    // intent: a transient API failure must still resolve via the on-chain rebuild
    vi.mocked(helpers.getPoolAddressesFromApi).mockRejectedValue(
      new Error('down')
    );
    vi.mocked(helpers.getPoolAddressesFromOnChain).mockResolvedValue(
      'CHAIN' as never
    );

    const res = await makeRepo().getPoolAddresses({ source: 'api-first' });

    expect(res).toBe('CHAIN');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
