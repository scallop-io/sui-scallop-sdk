import { describe, expect, it } from 'vitest';
import { ScallopConfigError } from 'src/errors/index.js';
import {
  assertConfigSnapshot,
  validateConfigSnapshot,
  REQUIRED_CORE_PATHS,
  REQUIRED_WHITELIST_KEYS,
  type ScallopConfigSnapshot,
} from 'src/models/scallopConstants/config/index.js';

const emptyWhitelist = {
  lending: new Set<string>(),
  collateral: new Set<string>(),
  borrowing: new Set<string>(),
  packages: new Set<string>(),
  scoin: new Set<string>(),
  spool: new Set<string>(),
  oracles: new Set<string>(),
  pythEndpoints: new Set<string>(),
  emerging: new Set<string>(),
  suiBridge: new Set<string>(),
  wormhole: new Set<string>(),
  layerZero: new Set<string>(),
};

const populatedWhitelist = {
  ...emptyWhitelist,
  lending: new Set(['sui']),
  collateral: new Set(['sui']),
  borrowing: new Set(['sui']),
  packages: new Set(['protocol']),
  scoin: new Set(['ssui']),
  spool: new Set(['ssui']),
  oracles: new Set(['pyth']),
  pythEndpoints: new Set(['https://hermes.pyth.network']),
};

const createSnapshot = (
  overrides?: Partial<{
    addrs: Record<string, string>;
    whitelist: typeof populatedWhitelist;
  }>
): ScallopConfigSnapshot => {
  const addrs: Record<string, string> = overrides?.addrs ?? {
    'core.version': '0x1',
    'core.market': '0x2',
    'core.packages.protocol.id': '0x3',
    'core.coinDecimalsRegistry': '0x4',
    'core.oracles.xOracle': '0x5',
  };
  return {
    addresses: undefined,
    poolAddresses: {},
    whitelist: overrides?.whitelist ?? populatedWhitelist,
    get: (path) => addrs[path as string],
  };
};

describe('config snapshot validation', () => {
  it('flags missing required address paths', () => {
    const snapshot = createSnapshot({
      addrs: { 'core.version': '0x1' },
      whitelist: populatedWhitelist,
    });
    const result = validateConfigSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.missingPaths).toEqual(
      REQUIRED_CORE_PATHS.filter((p) => p !== 'core.version')
    );
  });

  it('flags empty required whitelist keys', () => {
    const snapshot = createSnapshot({ whitelist: emptyWhitelist });
    const result = validateConfigSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.emptyWhitelistKeys.length).toBe(
      REQUIRED_WHITELIST_KEYS.length
    );
  });

  it('passes when every required path resolves and required whitelist sets are populated', () => {
    const snapshot = createSnapshot();
    expect(validateConfigSnapshot(snapshot)).toEqual({
      valid: true,
      missingPaths: [],
      emptyWhitelistKeys: [],
    });
  });

  it('assertConfigSnapshot throws ScallopConfigError on missing config', () => {
    const snapshot = createSnapshot({ addrs: {} });
    let caught: unknown;
    try {
      assertConfigSnapshot(snapshot);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ScallopConfigError);
    expect((caught as ScallopConfigError).code).toBe('SCALLOP_CONFIG_ERROR');
  });

  it('treats empty-string address values as missing', () => {
    const snapshot = createSnapshot({
      addrs: {
        'core.version': '',
        'core.market': '0x2',
        'core.packages.protocol.id': '0x3',
        'core.coinDecimalsRegistry': '0x4',
        'core.oracles.xOracle': '0x5',
      },
    });
    const result = validateConfigSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.missingPaths).toEqual(['core.version']);
  });
});
