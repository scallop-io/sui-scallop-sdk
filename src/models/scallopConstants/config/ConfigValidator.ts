import { ScallopConfigError } from 'src/errors/index.js';
import type { ScallopConfigSnapshot } from './ScallopConfigSnapshot.js';

/**
 * Address paths that must resolve to a non-empty value for the SDK to operate
 * the core lending market. Other paths are considered optional features.
 */
export const REQUIRED_CORE_PATHS = [
  'core.version',
  'core.market',
  'core.packages.protocol.id',
  'core.coinDecimalsRegistry',
  'core.oracles.xOracle',
] as const;

export type RequiredCorePath = (typeof REQUIRED_CORE_PATHS)[number];

export const REQUIRED_WHITELIST_KEYS = [
  'lending',
  'collateral',
  'borrowing',
  'packages',
  'scoin',
  'spool',
  'oracles',
  'pythEndpoints',
] as const;

export type ConfigValidationResult = {
  valid: boolean;
  missingPaths: RequiredCorePath[];
  emptyWhitelistKeys: string[];
};

export const validateConfigSnapshot = (
  snapshot: ScallopConfigSnapshot,
  options?: { requiredPaths?: readonly RequiredCorePath[] }
): ConfigValidationResult => {
  const requiredPaths = options?.requiredPaths ?? REQUIRED_CORE_PATHS;
  const missingPaths = requiredPaths.filter((p) => {
    const value = snapshot.get(p);
    return value === undefined || value === '';
  });

  const emptyWhitelistKeys = REQUIRED_WHITELIST_KEYS.filter((key) => {
    const set = snapshot.whitelist[key];
    return !set || set.size === 0;
  });

  return {
    valid: missingPaths.length === 0 && emptyWhitelistKeys.length === 0,
    missingPaths,
    emptyWhitelistKeys,
  };
};

export const assertConfigSnapshot = (
  snapshot: ScallopConfigSnapshot,
  options?: { requiredPaths?: readonly RequiredCorePath[] }
): void => {
  const result = validateConfigSnapshot(snapshot, options);
  if (!result.valid) {
    throw new ScallopConfigError('Scallop config snapshot is incomplete', {
      context: {
        missingPaths: result.missingPaths,
        emptyWhitelistKeys: result.emptyWhitelistKeys,
      },
    });
  }
};
