import { Logger } from 'src/logger/Logger.js';
import { ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client';
import { ScallopConstantsConstructorParams } from '../scallopConstants/types.js';
import ScallopConstants from '../scallopConstants/index.js';
import ScallopAddress from '../scallopAddress/index.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { ScallopBaseInterface } from '../interface.js';

export type ScallopUtilsConstructorParams = {
  walletAddress: string;
  scallopConstants?: ScallopConstants;
  logger?: Logger;
  suiClient?: ClientWithCoreApi;
  tokensPerSecond?: number;
} & {
  network: SuiClientTypes.Network;
  fullnodeUrl: string;
} & ScallopConstantsConstructorParams;

export interface ScallopUtilsInterface extends ScallopBaseInterface {
  address: ScallopAddress;
  onchain: OnChainDataSource;
}

export type CoinWrappedType =
  | {
      from: string;
      type: string;
    }
  | undefined;
