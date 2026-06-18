import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/repositories/xOracle/helpers.js', () => ({
  getAssetOraclesFromOnChain: vi.fn(),
  getPriceUpdatePoliciesFromOnChain: vi.fn(),
  getOnDemandAggObjectIdsFromOnChain: vi.fn(),
}));

import * as helpers from 'src/repositories/xOracle/helpers.js';
import { XOracleRepository } from 'src/repositories/xOracle/index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { XOracleMetadata } from 'src/repositories/xOracle/types.js';

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

  it('getPriceUpdatePolicies delegates to the onchain helper with the context', () => {
    vi.mocked(helpers.getPriceUpdatePoliciesFromOnChain).mockResolvedValue(
      {} as never
    );
    makeRepo().getPriceUpdatePolicies();
    expect(
      vi.mocked(helpers.getPriceUpdatePoliciesFromOnChain).mock.calls[0][0]
        .metadata
    ).toBe(metadata);
  });

  it('getOnDemandAggObjectIds forwards the requested coin names', () => {
    vi.mocked(helpers.getOnDemandAggObjectIdsFromOnChain).mockResolvedValue(
      [] as never
    );
    makeRepo().getOnDemandAggObjectIds(['sui', 'usdc']);
    expect(
      vi.mocked(helpers.getOnDemandAggObjectIdsFromOnChain).mock.calls[0][1]
    ).toEqual(['sui', 'usdc']);
  });
});
