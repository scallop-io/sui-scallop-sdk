import { PoolAddress } from 'src/types/index.js';
import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoArgs } from '../types.js';

export type IsolatedAssetsMetadata = {
  addresses: Pick<AddressesInterface['core'], 'market'>;
  poolAddresses: Readonly<Record<string, PoolAddress | undefined>>;
  whitelist: {
    lending: ReadonlySet<string>;
  };
};

export type IsolatedAssetsRepoContext = BaseContext & {
  metadata: IsolatedAssetsMetadata;
};

export type IsolatedAssetsRepoArgs = BaseRepoArgs & {
  metadata: IsolatedAssetsMetadata;
};
