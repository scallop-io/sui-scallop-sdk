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
  /**
   * Coalescing window (ms) for batched `getObject` reads. Default `0` (flush on
   * the next macrotask); raise to batch reads spread over a few ms, or `null`
   * for microtask-only. See `OnChainDataSource`.
   */
  objectBatchWindowMs?: number | null;
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
