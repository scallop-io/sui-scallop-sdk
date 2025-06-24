import * as dotenv from 'dotenv';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from 'src/models';
import { ADDRESS_INTERFACE, POOL_ADDRESSES, WHITELIST } from './mocks';
dotenv.config();

const NETWORK: NetworkType = 'mainnet';
export const scallopSDK = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699',
  secretKey: process.env.SECRET_KEY,
  networkType: NETWORK,
  forceAddressesInterface: ADDRESS_INTERFACE,
  forcePoolAddressInterface: POOL_ADDRESSES,
  forceWhitelistInterface: WHITELIST,
  usePythPullModel: false,
  pythSponsoredFeeds: [
    'wbtc',
    'sbwbtc',
    'sui',
    'afsui',
    'vsui',
    'hasui',
    'wsol',
    'wapt',
    'deep',
    'usdc',
    'wusdc',
    'wusdt',
    'sbusdt',
    'sca',
    'fud',
    'cetus',
    'haedal',
  ],
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  },
});
