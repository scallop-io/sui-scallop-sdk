import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helpers.js', () => ({
  getLoyaltyProgramInfosOnChain: vi.fn(),
}));

import * as helpers from './helpers.js';
import { LoyaltyProgramRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { LoyaltyProgramRepoMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as LoyaltyProgramRepoMetadata;

const makeRepo = () => new LoyaltyProgramRepository({ onchain, metadata });

beforeEach(() => vi.clearAllMocks());

describe('LoyaltyProgramRepository', () => {
  it('getLoyaltyProgramInfos passes the bare veScaKey with metadata on context', () => {
    vi.mocked(helpers.getLoyaltyProgramInfosOnChain).mockResolvedValue(
      {} as never
    );
    makeRepo().getLoyaltyProgramInfos('0xKEY');
    expect(
      vi.mocked(helpers.getLoyaltyProgramInfosOnChain).mock.calls[0][1]
    ).toBe('0xKEY');
    expect(
      vi.mocked(helpers.getLoyaltyProgramInfosOnChain).mock.calls[0][0].metadata
    ).toBe(metadata);
  });
});
