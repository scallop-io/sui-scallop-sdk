import type { PoolAddress } from 'src/types/index.js';
import type ScallopConstants from '../index.js';

export interface PoolAddressConfigSource {
  getPoolAddresses(): Readonly<Record<string, PoolAddress | undefined>>;
}

export const createLivePoolAddressConfigSource = (
  constants: ScallopConstants
): PoolAddressConfigSource => ({
  getPoolAddresses: () => constants.poolAddresses,
});
