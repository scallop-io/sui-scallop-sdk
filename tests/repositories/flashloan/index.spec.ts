import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/repositories/flashloan/helpers.js', () => ({
  getFlashloanFeesFromOnChain: vi.fn(),
}));

import * as helpers from 'src/repositories/flashloan/helpers.js';
import { FlashloanRepository } from 'src/repositories/flashloan/index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { FlashloanMetadata } from 'src/repositories/flashloan/types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as FlashloanMetadata;

const makeRepo = () => new FlashloanRepository({ onchain, metadata });

beforeEach(() => vi.clearAllMocks());

describe('FlashloanRepository', () => {
  it('getFlashloanFees wraps assetNames into { assetNames } with metadata on context', () => {
    vi.mocked(helpers.getFlashloanFeesFromOnChain).mockResolvedValue(
      {} as never
    );
    makeRepo().getFlashloanFees(['sui', 'usdc']);
    expect(
      vi.mocked(helpers.getFlashloanFeesFromOnChain).mock.calls[0][1]
    ).toEqual({ assetNames: ['sui', 'usdc'] });
    expect(
      vi.mocked(helpers.getFlashloanFeesFromOnChain).mock.calls[0][0].metadata
    ).toBe(metadata);
  });
});
