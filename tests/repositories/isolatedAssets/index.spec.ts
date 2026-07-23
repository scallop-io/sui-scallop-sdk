import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/repositories/isolatedAssets/helpers.js', () => ({
  getIsolatedAssetsFromApi: vi.fn(),
  getIsolatedAssetsFromOnChain: vi.fn(),
}));

import * as helpers from 'src/repositories/isolatedAssets/helpers.js';
import { IsolatedAssetsRepository } from 'src/repositories/isolatedAssets/index.js';
import type { GrpcDataSource } from 'src/datasources/grpc.js';
import type { IsolatedAssetsMetadata } from 'src/repositories/isolatedAssets/types.js';

const onchain = { url: 'mock://node' } as unknown as GrpcDataSource;
const metadata = { tag: 'META' } as unknown as IsolatedAssetsMetadata;
const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };

const makeRepo = () =>
  new IsolatedAssetsRepository({
    grpc: onchain,
    metadata,
    logger: logger as never,
  });

beforeEach(() => vi.clearAllMocks());

describe('IsolatedAssetsRepository', () => {
  it("source: 'api' calls the api helper only", async () => {
    vi.mocked(helpers.getIsolatedAssetsFromApi).mockResolvedValue([] as never);
    await makeRepo().getIsolatedAssets({ source: 'api' });
    expect(helpers.getIsolatedAssetsFromApi).toHaveBeenCalledTimes(1);
    expect(helpers.getIsolatedAssetsFromOnChain).not.toHaveBeenCalled();
  });

  it('an undefined source resolves to onchain (the runWithDataSourceFallback default)', async () => {
    // intent: with no source, getIsolatedAssets must not require the api branch
    vi.mocked(helpers.getIsolatedAssetsFromOnChain).mockResolvedValue(
      [] as never
    );
    await makeRepo().getIsolatedAssets({});
    expect(helpers.getIsolatedAssetsFromOnChain).toHaveBeenCalledTimes(1);
    expect(helpers.getIsolatedAssetsFromApi).not.toHaveBeenCalled();
  });

  it("'api-first' falls back to onchain on api error", async () => {
    vi.mocked(helpers.getIsolatedAssetsFromApi).mockRejectedValue(
      new Error('down')
    );
    vi.mocked(helpers.getIsolatedAssetsFromOnChain).mockResolvedValue(
      'CHAIN' as never
    );
    const res = await makeRepo().getIsolatedAssets({ source: 'api-first' });
    expect(res).toBe('CHAIN');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
