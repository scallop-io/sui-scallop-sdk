import type { AddressStringPath, Whitelist } from 'src/types/index.js';
import type { AddressConfigSource } from './AddressConfigSource.js';
import type { PoolAddressConfigSource } from './PoolAddressConfigSource.js';
import type { WhitelistConfigSource } from './WhitelistConfigSource.js';
import {
  assertConfigSnapshot,
  type RequiredCorePath,
} from './ConfigValidator.js';
import type { ScallopConfigSnapshot } from './ScallopConfigSnapshot.js';

export type ScallopConfigSources = {
  addressSource: AddressConfigSource;
  poolAddressSource: PoolAddressConfigSource;
  whitelistSource: WhitelistConfigSource;
};

const getPath = (object: unknown, path: string): string | undefined => {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, object);

  return typeof value === 'string' && value !== '' ? value : undefined;
};

const WHITELIST_KEYS = [
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
] as const satisfies readonly (keyof Whitelist)[];

const normalizeWhitelist = (whitelist: unknown): Whitelist => {
  const source = whitelist as Record<string, unknown>;
  return WHITELIST_KEYS.reduce((acc, key) => {
    const value = source?.[key];
    acc[key] =
      value instanceof Set
        ? new Set(value)
        : new Set(Array.isArray(value) ? value : []);
    return acc;
  }, {} as Whitelist);
};

export const loadScallopConfigSnapshot = (
  sources: ScallopConfigSources,
  options?: {
    validate?: boolean;
    requiredPaths?: readonly RequiredCorePath[];
  }
): ScallopConfigSnapshot => {
  const addresses = sources.addressSource.getAddresses();
  const snapshot: ScallopConfigSnapshot = {
    addresses,
    poolAddresses: sources.poolAddressSource.getPoolAddresses(),
    whitelist: normalizeWhitelist(
      sources.whitelistSource.getWhitelist()
    ) as ScallopConfigSnapshot['whitelist'],
    get: (path: AddressStringPath) => getPath(addresses, path),
  };

  if (options?.validate) {
    assertConfigSnapshot(snapshot, { requiredPaths: options.requiredPaths });
  }

  return snapshot;
};
