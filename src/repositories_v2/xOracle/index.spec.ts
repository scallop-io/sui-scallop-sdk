import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helpers.js', () => ({
  getAssetOraclesFromOnChain: vi.fn(),
}));

import * as helpers from './helpers.js';
import { XOracleRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { XOracleMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as XOracleMetadata;

const makeRepo = () => new XOracleRepository({ onchain, metadata });

beforeEach(() => vi.clearAllMocks());

describe('XOracleRepository', () => {
  it('getAssetOracles delegates to the onchain helper with the assembled context', () => {
    vi.mocked(helpers.getAssetOraclesFromOnChain).mockResolvedValue(
      {} as never
    );
    makeRepo().getAssetOracles();
    const ctx = vi.mocked(helpers.getAssetOraclesFromOnChain).mock.calls[0][0];
    expect(ctx.metadata).toBe(metadata);
    expect(ctx.onchain).toBe(onchain);
  });

  it('returns the helper result unchanged', async () => {
    vi.mocked(helpers.getAssetOraclesFromOnChain).mockResolvedValue(
      'ORACLES' as never
    );
    expect(await makeRepo().getAssetOracles()).toBe('ORACLES');
  });
});
