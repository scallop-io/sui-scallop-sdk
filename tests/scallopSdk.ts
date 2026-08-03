import * as dotenv from 'dotenv';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from 'src/entries/index.js';
import { ADDRESSES, POOL_ADDRESSES, WHITELIST } from './mocks.js';
dotenv.config();

const NETWORK: NetworkType = 'mainnet';
export const scallopSDK = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  secretKey: process.env.SECRET_KEY,
  network: NETWORK,
  forceAddressesInterface: ADDRESSES,
  forcePoolAddressInterface: POOL_ADDRESSES,
  forceWhitelistInterface: WHITELIST,
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
  readTransport: 'grpc',
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  },
});

export const graphQLScallopSDK = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  secretKey: process.env.SECRET_KEY,
  network: NETWORK,
  forceAddressesInterface: ADDRESSES,
  forcePoolAddressInterface: POOL_ADDRESSES,
  forceWhitelistInterface: WHITELIST,
  readTransport: 'graphql',
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
  graphqlUrl: 'https://graphql.mainnet.sui.io/graphql',
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  },
});
