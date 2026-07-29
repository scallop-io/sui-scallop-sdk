import { PoolAddress } from 'src/types/index.js';
import { AddressesInterface } from 'src/types/address.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { BaseContext, BaseRepoParams } from '../types.js';

export type IsolatedAssetsMetadata = {
  addresses: Pick<AddressesInterface['core'], 'market'>;
  poolAddresses: Readonly<Record<string, PoolAddress | undefined>>;
  whitelist: {
    lending: ReadonlySet<string>;
  };
};

export type IsolatedAssetsRepoContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: IsolatedAssetsMetadata;
};

// On-chain read: lists isolated-asset dynamic fields off the market object.
// Touches only the market address + the rate-limited Sui client; no api/whitelist.
export type IsolatedAssetsOnChainContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: Pick<IsolatedAssetsMetadata, 'addresses'>;
};

// Api read: pure filter over the pre-resolved poolAddresses bundle + whitelist.
// No datasource — never reaches the indexer or the on-chain client.
export type IsolatedAssetsApiContext = {
  metadata: Pick<IsolatedAssetsMetadata, 'poolAddresses' | 'whitelist'>;
};

export type IsolatedAssetsRepoParams = BaseRepoParams & {
  grpc: GrpcDataSource;
  metadata: IsolatedAssetsMetadata;
};
