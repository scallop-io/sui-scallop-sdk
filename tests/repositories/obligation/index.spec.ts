import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/repositories/obligation/helpers.js', () => ({
  getObligationsFromOnChain: vi.fn(),
  queryObligationData: vi.fn(),
  getObligationLockedFromOnChain: vi.fn(),
}));

import * as helpers from 'src/repositories/obligation/helpers.js';
import { ObligationRepository } from 'src/repositories/obligation/index.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import type { ObligationRepoMetadata } from 'src/repositories/obligation/types.js';

const onchain = { url: 'mock://node' } as unknown as OnChainDataSource;
const metadata = { tag: 'META' } as unknown as ObligationRepoMetadata;

const makeRepo = () => new ObligationRepository({ onchain, metadata });

beforeEach(() => vi.clearAllMocks());

describe('ObligationRepository', () => {
  it('exposes metadata on the context', () => {
    vi.mocked(helpers.getObligationsFromOnChain).mockResolvedValue([] as never);
    makeRepo().getObligations('0xA');
    expect(
      vi.mocked(helpers.getObligationsFromOnChain).mock.calls[0][0].metadata
    ).toBe(metadata);
  });

  it('getObligations wraps the address into { address }', () => {
    vi.mocked(helpers.getObligationsFromOnChain).mockResolvedValue([] as never);
    makeRepo().getObligations('0xADDR');
    expect(
      vi.mocked(helpers.getObligationsFromOnChain).mock.calls[0][1]
    ).toEqual({ address: '0xADDR' });
  });

  it('getObligationData passes the bare obligationId', () => {
    vi.mocked(helpers.queryObligationData).mockResolvedValue({} as never);
    makeRepo().getObligationData('0xOB');
    expect(vi.mocked(helpers.queryObligationData).mock.calls[0][1]).toBe(
      '0xOB'
    );
  });

  it('getObligationLocked delegates the bare obligationId to the helper', () => {
    vi.mocked(helpers.getObligationLockedFromOnChain).mockResolvedValue(false);
    makeRepo().getObligationLocked('0xOB');
    expect(
      vi.mocked(helpers.getObligationLockedFromOnChain).mock.calls[0][1]
    ).toBe('0xOB');
  });
});
