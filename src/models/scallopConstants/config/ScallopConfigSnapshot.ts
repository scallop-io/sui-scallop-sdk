import type {
  AddressesInterface,
  AddressStringPath,
  PoolAddress,
} from 'src/types/index.js';
import type ScallopConstants from '../index.js';

/**
 * Immutable read-only view of the live `ScallopConstants` state used by
 * services that should not mutate constants. Cheap to build — does not deep
 * copy. Treat fields as read-only by convention; the readonly types prevent
 * accidental writes at the TS level.
 */
export interface ScallopConfigSnapshot {
  readonly addresses: Readonly<AddressesInterface> | undefined;
  readonly poolAddresses: Readonly<Record<string, PoolAddress | undefined>>;
  readonly whitelist: Readonly<{
    lending: ReadonlySet<string>;
    collateral: ReadonlySet<string>;
    borrowing: ReadonlySet<string>;
    packages: ReadonlySet<string>;
    scoin: ReadonlySet<string>;
    spool: ReadonlySet<string>;
    oracles: ReadonlySet<string>;
    pythEndpoints: ReadonlySet<string>;
    emerging: ReadonlySet<string>;
    suiBridge: ReadonlySet<string>;
    wormhole: ReadonlySet<string>;
    layerZero: ReadonlySet<string>;
  }>;
  get(path: AddressStringPath): string | undefined;
}

export const createScallopConfigSnapshot = (
  constants: ScallopConstants
): ScallopConfigSnapshot => {
  return {
    addresses: constants.getAddresses(),
    poolAddresses: constants.poolAddresses,
    whitelist: constants.whitelist as ScallopConfigSnapshot['whitelist'],
    get: (path: AddressStringPath) => {
      const value = constants.get(path);
      return value === '' ? undefined : value;
    },
  };
};
