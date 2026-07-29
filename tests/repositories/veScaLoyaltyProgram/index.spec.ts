import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/repositories/veScaLoyaltyProgram/helpers.js', () => ({
  getVeScaLoyaltyProgramInfosOnChain: vi.fn(),
}));

import * as helpers from 'src/repositories/veScaLoyaltyProgram/helpers.js';
import { VeScaLoyaltyProgramRepository } from 'src/repositories/veScaLoyaltyProgram/index.js';
import type { GrpcDataSource } from 'src/datasources/grpc.js';
import type { VeScaLoyaltyProgramRepoMetadata } from 'src/repositories/veScaLoyaltyProgram/types.js';

const onchain = { url: 'mock://node' } as unknown as GrpcDataSource;
const metadata = { tag: 'META' } as unknown as VeScaLoyaltyProgramRepoMetadata;

const makeRepo = () =>
  new VeScaLoyaltyProgramRepository({ grpc: onchain, metadata });

beforeEach(() => vi.clearAllMocks());

describe('VeScaLoyaltyProgramRepository', () => {
  it('getVeScaLoyaltyProgramInfos passes the bare veScaKey with metadata on context', () => {
    vi.mocked(helpers.getVeScaLoyaltyProgramInfosOnChain).mockResolvedValue(
      {} as never
    );
    makeRepo().getVeScaLoyaltyProgramInfos('0xKEY');
    expect(
      vi.mocked(helpers.getVeScaLoyaltyProgramInfosOnChain).mock.calls[0][1]
    ).toBe('0xKEY');
    expect(
      vi.mocked(helpers.getVeScaLoyaltyProgramInfosOnChain).mock.calls[0][0]
        .metadata
    ).toBe(metadata);
  });
});
