import * as dotenv from 'dotenv';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from 'src';
dotenv.config();

const NETWORK: NetworkType = 'mainnet';
export const scallopSDK = new Scallop({
  secretKey: process.env.SECRET_KEY,
  networkType: NETWORK,
});
