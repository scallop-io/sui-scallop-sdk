import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/repositories/loyaltyProgram/helpers.js', () => ({
  getLoyaltyProgramInfosOnChain: vi.fn(),
}));

import * as helpers from 'src/repositories/loyaltyProgram/helpers.js';
import { LoyaltyProgramRepository } from 'src/repositories/loyaltyProgram/index.js';
import type { GrpcDataSource } from 'src/datasources/grpc.js';
import type { LoyaltyProgramRepoMetadata } from 'src/repositories/loyaltyProgram/types.js';

const onchain = { url: 'mock://node' } as unknown as GrpcDataSource;
const metadata = { tag: 'META' } as unknown as LoyaltyProgramRepoMetadata;

const makeRepo = () =>
  new LoyaltyProgramRepository({ grpc: onchain, metadata });

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
