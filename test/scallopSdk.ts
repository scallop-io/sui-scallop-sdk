import * as dotenv from 'dotenv';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from 'src';
// import { POOL_ADDRESSES, WHITELIST } from './mocks';
dotenv.config();

const NETWORK: NetworkType = 'mainnet';
export const scallopSDK = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699',
  secretKey: process.env.SECRET_KEY,
  networkType: NETWORK,
  // forcePoolAddressInterface: POOL_ADDRESSES,
  // forceWhitelistInterface: WHITELIST,
});
