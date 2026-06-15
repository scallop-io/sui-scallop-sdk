import { BaseContext, BaseRepoArgs } from '../types.js';

export type FlashloanRepoContext = BaseContext & {
  metadata: FlashloanMetadata;
};

export type FlashloanRepoArgs = BaseRepoArgs & {
  metadata: FlashloanMetadata;
};

export type FlashloanMetadata = {
  coinTypeToCoinNameMap: ReadonlyMap<string, string>;
};
