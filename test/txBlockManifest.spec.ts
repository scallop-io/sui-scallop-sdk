import { describe, expect, it } from 'vitest';
import { newScallopTxBlock } from 'src/builders/index.js';
import {
  TX_BLOCK_MANIFEST,
  detectManifestCollisions,
} from 'src/builders/manifest.js';
import { verifyTxBlockMethods } from 'src/builders/verify.js';
import type { ScallopBuilder } from 'src/models/index.js';

const DUMMY_ADDR = '0x1';
const DUMMY_TYPE = '0x1::sui::SUI';

const createStubBuilder = (): ScallopBuilder => {
  const stub = {
    address: { get: () => DUMMY_ADDR, getId: () => 'addr-id' },
    utils: {
      parseCoinType: () => DUMMY_TYPE,
      parseMarketCoinType: () => DUMMY_TYPE,
      parseSCoinType: () => DUMMY_TYPE,
      parseUnderlyingSCoinType: () => DUMMY_TYPE,
      getSCoinTreasury: () => DUMMY_ADDR,
      getSpoolRewardCoinName: () => 'sca',
      mergeSimilarCoins: async () => {},
    },
    constants: {
      whitelist: {
        lending: new Set<string>(),
        collateral: new Set<string>(),
        spool: new Set<string>(),
      },
      coinTypes: { sca: DUMMY_TYPE },
    },
    moveCall: () => ({}),
    suiKit: { suiInteractor: { selectCoins: async () => [] } },
    selectSCoin: async () => ({}),
    selectMarketCoin: async () => ({}),
    query: {
      getVeScas: async () => [],
      getBindedVeScaKey: async () => undefined,
    },
  };
  return stub as unknown as ScallopBuilder;
};

describe('tx-block manifest', () => {
  it('has no unexpected method-name collisions across modules', () => {
    const collisions = detectManifestCollisions();
    expect(collisions).toEqual([]);
  });

  it('lists at least one method per module', () => {
    for (const [moduleName, methods] of Object.entries(TX_BLOCK_MANIFEST)) {
      expect(methods.length, `${moduleName} has no methods`).toBeGreaterThan(0);
    }
  });

  it('verifyTxBlockMethods reports missing entries when methods are absent', () => {
    const fake = { supply: () => {} };
    const result = verifyTxBlockMethods(fake);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing.find((m) => m.method === 'supply')).toBeUndefined();
  });

  it('verifyTxBlockMethods returns no missing entries when all manifest methods are present', () => {
    const fake: Record<string, () => void> = {};
    for (const methods of Object.values(TX_BLOCK_MANIFEST)) {
      for (const m of methods) fake[m] = () => {};
    }
    const result = verifyTxBlockMethods(fake);
    expect(result.missing).toEqual([]);
    expect(result.collisions).toEqual([]);
  });

  it('every manifest method is reachable on a composed ScallopTxBlock', () => {
    const builder = createStubBuilder();
    const txBlock = newScallopTxBlock(builder);
    const result = verifyTxBlockMethods(txBlock as unknown as object);
    expect(result.collisions).toEqual([]);
    expect(
      result.missing,
      `missing tx-block methods: ${JSON.stringify(result.missing)}`
    ).toEqual([]);
  });
});
