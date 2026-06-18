import type { NetworkType } from '@scallop-io/sui-kit';
import type { AddressesInterface } from 'src/types/index.js';
import type ScallopConstants from '../index.js';

export interface AddressConfigSource {
  getAddresses(networkType?: NetworkType): AddressesInterface | undefined;
}

export const createLiveAddressConfigSource = (
  constants: ScallopConstants
): AddressConfigSource => ({
  getAddresses: () => constants.getAddresses(),
});
