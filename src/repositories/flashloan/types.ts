import { BaseContext, BaseRepoParams } from '../types.js';
import { OnChainDataSource } from '../../datasources/onchain.js';

export type FlashloanRepoContext = BaseContext & {
  onchain: OnChainDataSource;
  metadata: FlashloanMetadata;
};

export type FlashloanRepoParams = BaseRepoParams & {
  onchain: OnChainDataSource;
  metadata: FlashloanMetadata;
};

export type FlashloanMetadata = {
  coinTypeToCoinNameMap: ReadonlyMap<string, string>;
};
