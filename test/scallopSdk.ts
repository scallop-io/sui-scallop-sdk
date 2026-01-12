import * as dotenv from 'dotenv';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from 'src';
import { ADDRESS_INTERFACE, POOL_ADDRESSES, WHITELIST } from './mocks';
dotenv.config();

const NETWORK: NetworkType = 'mainnet';
export const scallopSDK = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  secretKey: process.env.SECRET_KEY,
  networkType: NETWORK,
  forceAddressesInterface: ADDRESS_INTERFACE,
  forcePoolAddressInterface: POOL_ADDRESSES,
  forceWhitelistInterface: WHITELIST,
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  },
});
