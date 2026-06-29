import { describe, expect, it } from 'vitest';
import { newScallopTxBlock } from 'src/txBuilders/index.js';
import {
  buildTxBlockModules,
  TX_BLOCK_MODULE_KEYS,
} from 'src/txBuilders/modules.js';
import {
  CORE_NORMAL_METHODS,
  CORE_QUICK_METHODS,
  SPOOL_METHODS,
  BORROW_INCENTIVE_METHODS,
  VESCA_METHODS,
  REFERRAL_METHODS,
  LOYALTY_METHODS,
  SCOIN_METHODS,
} from 'src/txBuilders/manifest.js';
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

describe('tx-block explicit modules', () => {
  it('TX_BLOCK_MODULE_KEYS covers every declared module', () => {
    expect([...TX_BLOCK_MODULE_KEYS].sort()).toEqual(
      [
        'borrowIncentive',
        'core',
        'loyalty',
        'obligationNaming',
        'referral',
        'sCoin',
        'spool',
        'vesca',
      ].sort()
    );
  });

  it('buildTxBlockModules picks methods off a flat source', () => {
    const flat: Record<string, unknown> = {};
    const allManifest = [
      ...CORE_NORMAL_METHODS,
      ...CORE_QUICK_METHODS,
      ...SPOOL_METHODS,
      ...BORROW_INCENTIVE_METHODS,
      ...VESCA_METHODS,
      ...REFERRAL_METHODS,
      ...LOYALTY_METHODS,
      ...SCOIN_METHODS,
      'unrelated',
    ];
    for (const name of allManifest) flat[name] = () => name;

    const modules = buildTxBlockModules(flat);
    expect(typeof modules.core.supply).toBe('function');
    expect(typeof modules.spool.stake).toBe('function');
    expect(typeof modules.vesca.lockSca).toBe('function');
    expect(typeof modules.borrowIncentive.stakeObligation).toBe('function');
    expect(typeof modules.referral.bindToReferral).toBe('function');
    expect(typeof modules.loyalty.claimLoyaltyRevenue).toBe('function');
    expect(typeof modules.sCoin.mintSCoin).toBe('function');
    expect(
      (modules.core as unknown as Record<string, unknown>).unrelated
    ).toBeUndefined();
  });

  it('module views are frozen', () => {
    const flat: Record<string, unknown> = {};
    for (const name of CORE_NORMAL_METHODS) flat[name] = () => {};
    const modules = buildTxBlockModules(flat);
    expect(Object.isFrozen(modules)).toBe(true);
    expect(Object.isFrozen(modules.core)).toBe(true);
  });

  it('flat methods on composed proxy match the corresponding module-view reference', () => {
    const builder = createStubBuilder();
    const tx = newScallopTxBlock(builder);
    expect((tx as unknown as Record<string, unknown>).supply).toBe(
      tx.core.supply
    );
    expect((tx as unknown as Record<string, unknown>).stake).toBe(
      tx.spool.stake
    );
    expect((tx as unknown as Record<string, unknown>).lockSca).toBe(
      tx.vesca.lockSca
    );
    expect((tx as unknown as Record<string, unknown>).mintSCoin).toBe(
      tx.sCoin.mintSCoin
    );
  });

  it('every manifest method is reachable through its module view', () => {
    const builder = createStubBuilder();
    const tx = newScallopTxBlock(builder);
    const checks: Array<[string, readonly string[]]> = [
      ['core', [...CORE_NORMAL_METHODS, ...CORE_QUICK_METHODS]],
      ['spool', SPOOL_METHODS],
      ['borrowIncentive', BORROW_INCENTIVE_METHODS],
      ['vesca', VESCA_METHODS],
      ['referral', REFERRAL_METHODS],
      ['loyalty', LOYALTY_METHODS],
      ['sCoin', SCOIN_METHODS],
    ];
    for (const [moduleKey, methods] of checks) {
      const module = (tx as unknown as Record<string, Record<string, unknown>>)[
        moduleKey
      ];
      for (const method of methods) {
        expect(
          typeof module[method],
          `tx.${moduleKey}.${method} should be a function`
        ).toBe('function');
      }
    }
  });

  it('"<module>" in tx returns true for each declared module key', () => {
    const builder = createStubBuilder();
    const tx = newScallopTxBlock(builder);
    for (const key of TX_BLOCK_MODULE_KEYS) {
      expect(key in tx).toBe(true);
    }
  });
});
