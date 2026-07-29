import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/repositories/referral/helper.js', () => ({
  getVeScaKeyIdFromRefBindingsFromOnChain: vi.fn(),
}));

import * as helpers from 'src/repositories/referral/helper.js';
import { ReferralRepository } from 'src/repositories/referral/index.js';
import type { GrpcDataSource } from 'src/datasources/grpc.js';
import type { ReferralRepoMetadata } from 'src/repositories/referral/types.js';

const onchain = { url: 'mock://node' } as unknown as GrpcDataSource;
const metadata = { tag: 'META' } as unknown as ReferralRepoMetadata;

const makeRepo = () => new ReferralRepository({ grpc: onchain, metadata });

beforeEach(() => vi.clearAllMocks());

describe('ReferralRepository', () => {
  it('getVeScaKeyIdFromReferralBindings forwards the bare refereeAddress with metadata on the context', () => {
    vi.mocked(
      helpers.getVeScaKeyIdFromRefBindingsFromOnChain
    ).mockResolvedValue(null as never);

    makeRepo().getVeScaKeyIdFromReferralBindings('0xREF');

    const calls = vi.mocked(helpers.getVeScaKeyIdFromRefBindingsFromOnChain)
      .mock.calls;
    expect(calls[0][1]).toBe('0xREF');
    expect(calls[0][0].metadata).toBe(metadata);
  });
});
