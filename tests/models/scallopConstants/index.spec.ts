import { describe, expect, it, vi } from 'vitest';
import ScallopConstants from 'src/models/scallopConstants/index.js';
import type { ConstantsSource } from 'src/models/scallopConstants/constantsSource.js';
import type { Whitelist } from 'src/models/scallopConstants/types.js';
import type { PoolAddress } from 'src/repositories/poolAddresses/types.js';

/**
 * Characterization tests for `ScallopConstants.init()` — they pin the
 * orchestration semantics (fetch, whitelist-filtering, force-override +
 * already-initialized short-circuit) BEFORE that orchestration is extracted into
 * a `loadConstantsState` loader. Driven by an injected fake `ConstantsSource`, so
 * no network. This is the safety net the refactor plan (§5) requires.
 */

const WHITELIST_KEYS: (keyof Whitelist)[] = [
  'lending',
  'borrowing',
  'collateral',
  'packages',
  'spool',
  'scoin',
  'suiBridge',
  'wormhole',
  'layerZero',
  'oracles',
  'borrowIncentiveRewards',
  'rewardsAsPoint',
  'pythEndpoints',
  'deprecated',
  'emerging',
];

// Every key required by `isInitializedFor` must be non-empty to satisfy the
// already-initialized short-circuit.
const REQUIRED = {
  lending: ['usdc'],
  collateral: ['usdc'],
  borrowing: ['usdc'],
  packages: ['pkg'],
  scoin: ['susdc'],
  spool: ['sspool'],
  oracles: ['oracle'],
  pythEndpoints: ['pyth'],
  emerging: ['emerging'],
};

const whitelist = (
  overrides: Partial<Record<keyof Whitelist, string[]>> = {}
): Whitelist =>
  Object.fromEntries(
    WHITELIST_KEYS.map((k) => [k, new Set(overrides[k] ?? [])])
  ) as Whitelist;

const pool = (p: Partial<PoolAddress>): PoolAddress => p as PoolAddress;

// Minimal fake ScallopAddress — only the methods init() touches.
const fakeAddress = (addresses: object = {}) =>
  ({
    getAddresses: () => addresses,
    get: () => undefined,
    url: 'mock://node',
  }) as never;

const makeSource = (over: Partial<ConstantsSource> = {}): ConstantsSource => ({
  ensureAddresses: vi.fn(async () => {}),
  getAddresses: vi.fn(() => undefined),
  fetchWhitelist: vi.fn(async () => whitelist()),
  fetchPoolAddresses: vi.fn(async () => ({})),
  ...over,
});

describe('ScallopConstants.init() characterization', () => {
  it('fetches via the source, filters poolAddresses to whitelisted keys, derives maps', async () => {
    const source = makeSource({
      fetchWhitelist: vi.fn(async () => whitelist({ lending: ['usdc'] })),
      fetchPoolAddresses: vi.fn(async () => ({
        usdc: pool({
          coinName: 'usdc',
          coinType: '0xusdc::usdc::USDC',
          decimals: 6,
        }),
        // 'junk' is in no whitelist set → must be filtered out
        junk: pool({ coinName: 'junk', coinType: '0xj::j::J', decimals: 0 }),
      })),
    });

    const constants = new ScallopConstants({
      scallopAddress: fakeAddress({}), // empty → not initialized → fetch path
      constantsSource: source,
    } as never);

    await constants.init();

    expect(source.fetchWhitelist).toHaveBeenCalledTimes(1);
    expect(source.fetchPoolAddresses).toHaveBeenCalledTimes(1);
    expect(constants.poolAddresses.usdc).toBeTruthy();
    expect(constants.poolAddresses.junk).toBeUndefined();
    expect(constants.coinDecimals.usdc).toBe(6);
    expect(constants.whitelist.lending.has('usdc')).toBe(true);
  });

  it('honors force overrides and short-circuits (no fetch) when already initialized', async () => {
    // The live source.getAddresses delegates to the address; mirror that so the
    // loader sees addresses as initialized.
    const source = makeSource({
      getAddresses: vi.fn(() => ({ core: { object: '0xabc' } }) as never),
    });

    const constants = new ScallopConstants({
      // non-empty addresses → isAddressInitialized true
      scallopAddress: fakeAddress({ core: { object: '0xabc' } }),
      constantsSource: source,
      forcePoolAddressInterface: {
        usdc: pool({
          coinName: 'usdc',
          coinType: '0xusdc::usdc::USDC',
          decimals: 6,
        }),
      },
      forceWhitelistInterface: REQUIRED,
    } as never);

    await constants.init();

    // short-circuit: no network fetch
    expect(source.fetchWhitelist).not.toHaveBeenCalled();
    expect(source.fetchPoolAddresses).not.toHaveBeenCalled();
    // forced data is present + derived
    expect(constants.poolAddresses.usdc).toBeTruthy();
    expect(constants.coinDecimals.usdc).toBe(6);
    expect(constants.whitelist.lending.has('usdc')).toBe(true);
  });

  it('always reads addresses through the source', async () => {
    const source = makeSource();
    const constants = new ScallopConstants({
      scallopAddress: fakeAddress({}),
      constantsSource: source,
    } as never);

    await constants.init();

    expect(source.ensureAddresses).toHaveBeenCalledWith({
      network: 'mainnet',
      force: false,
      addressId: undefined,
    });
  });

  it('freezes the whitelist snapshot (mutation throws)', async () => {
    const source = makeSource({
      fetchWhitelist: vi.fn(async () => whitelist({ lending: ['usdc'] })),
    });
    const constants = new ScallopConstants({
      scallopAddress: fakeAddress({}),
      constantsSource: source,
    } as never);

    await constants.init();

    expect(() => constants.whitelist.lending.add('x')).toThrow();
  });
});
