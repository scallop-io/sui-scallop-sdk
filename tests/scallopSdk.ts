import * as dotenv from 'dotenv';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from 'src/entries/index.js';
import { ADDRESS_INTERFACE, POOL_ADDRESSES, WHITELIST } from './mocks.js';
dotenv.config();

const NETWORK: NetworkType = 'mainnet';
export const scallopSDK = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  secretKey: process.env.SECRET_KEY,
  network: NETWORK,
  forceAddressesInterface: ADDRESS_INTERFACE,
  forcePoolAddressInterface: POOL_ADDRESSES,
  forceWhitelistInterface: WHITELIST,
  pythEndpoints: ['https://pyth.dourolabs.app/hermes'],
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  },
});
