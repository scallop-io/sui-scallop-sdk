import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./helpers.js', () => ({
  getVeScaDataFromOnChain: vi.fn(),
  getVeScasByAddressFromOnChain: vi.fn(),
  getVeScaTreasuryInfoFromOnChain: vi.fn(),
}));

import * as helpers from './helpers.js';
import { VeScaRepository } from './index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { VeScaRepoMetadata } from './types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as VeScaRepoMetadata;

const makeRepo = () => new VeScaRepository({ onchain, metadata });

beforeEach(() => vi.clearAllMocks());

describe('VeScaRepository', () => {
  it('getVeSca passes the bare veScaKey with metadata on the context', () => {
    vi.mocked(helpers.getVeScaDataFromOnChain).mockResolvedValue(null as never);
    makeRepo().getVeSca('0xKEY');
    expect(vi.mocked(helpers.getVeScaDataFromOnChain).mock.calls[0][1]).toBe(
      '0xKEY'
    );
    expect(
      vi.mocked(helpers.getVeScaDataFromOnChain).mock.calls[0][0].metadata
    ).toBe(metadata);
  });

  it('getVeScasByAddress defaults excludeEmpty to true', () => {
    // intent: callers rely on empty veScas being filtered unless they opt in
    vi.mocked(helpers.getVeScasByAddressFromOnChain).mockResolvedValue(
      [] as never
    );
    makeRepo().getVeScasByAddress({ address: '0xA' });
    expect(
      vi.mocked(helpers.getVeScasByAddressFromOnChain).mock.calls[0][1]
    ).toEqual({ address: '0xA', excludeEmpty: true });
  });

  it('getVeScasByAddress forwards an explicit excludeEmpty: false', () => {
    vi.mocked(helpers.getVeScasByAddressFromOnChain).mockResolvedValue(
      [] as never
    );
    makeRepo().getVeScasByAddress({ address: '0xA', excludeEmpty: false });
    expect(
      vi.mocked(helpers.getVeScasByAddressFromOnChain).mock.calls[0][1]
    ).toEqual({ address: '0xA', excludeEmpty: false });
  });
});
