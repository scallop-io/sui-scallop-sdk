import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helper.js', () => ({
  getVeScaKeyIdFromRefBindingsFromOnChain: vi.fn(),
}));

import * as helpers from './helper.js';
import { ReferralRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { ReferralRepoMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as ReferralRepoMetadata;

const makeRepo = () => new ReferralRepository({ onchain, metadata });

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
