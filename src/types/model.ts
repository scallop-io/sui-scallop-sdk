import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import type { Transaction, TransactionResult } from '@mysten/sui/transactions';
import type { SuiKit, SuiKitParams, NetworkType } from '@scallop-io/sui-kit';
import type {
  ScallopAddress,
  ScallopQuery,
  ScallopUtils,
  ScallopBuilder,
  ScallopIndexer,
} from '../models';
import { ScallopCache } from 'src/models/scallopCache';
import { AddressesInterface } from './address';
import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import { AxiosInstance } from 'axios';
import { PoolAddress, Whitelist } from './constant';
import { ScallopConstants } from 'src/models/scallopConstants';

export type ScallopClientFnReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : Transaction;

export type ScallopClientVeScaReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : {
      tx: Transaction;
      scaCoin: TransactionResult;
    };

export type ScallopBaseInstanceParams = {
  suiKit?: SuiKit;
  cache?: ScallopCache;
};

export type ScallopCacheInstanceParams = ScallopBaseInstanceParams & {
  queryClient?: QueryClient;
};

export type ScallopAddressInstanceParams = ScallopBaseInstanceParams & {
  cache?: ScallopCache;
};

export type ScallopConstantsInstanceParams = {
  address?: ScallopAddress;
  cache?: ScallopCache;
};

export type ScallopIndexerInstanceParams = {
  cache?: ScallopCache;
};

export type ScallopUtilsInstanceParams = ScallopBaseInstanceParams & {
  constants?: ScallopConstants;
};

export type ScallopQueryInstanceParams = ScallopBaseInstanceParams & {
  utils?: ScallopUtils;
  indexer?: ScallopIndexer;
};

export type ScallopBuilderInstanceParams = ScallopBaseInstanceParams & {
  query?: ScallopQuery;
};

export type ScallopClientInstanceParams = ScallopBaseInstanceParams & {
  builder?: ScallopBuilder;
};

export type ScallopCacheConfig = {
  tokensPerInterval?: number; // How many requests per interval
  interval?: number; // Interval in milliseconds
};

export type ScallopCacheParams = {
  walletAddress?: string;
  cacheOptions?: QueryClientConfig;
  config?: ScallopCacheConfig;
} & SuiKitParams;

export type ScallopIndexerParams = ScallopCacheParams & {
  indexerApiUrl?: string;
  axios?: AxiosInstance;
};

export type ScallopAddressParams = ScallopCacheParams & {
  addressApiUrl?: string;
  addressId: string;
  auth?: string;
  network?: NetworkType;
  forceAddressesInterface?: Partial<Record<NetworkType, AddressesInterface>>;
};

export type ScallopConstantsParams = ScallopAddressParams & {
  poolAddressesApiUrl?: string;
  whitelistApiUrl?: string;
  forcePoolAddressInterface?: Record<string, PoolAddress>;
  forceWhitelistInterface?: Whitelist;
};

export type ScallopUtilsParams = ScallopAddressParams &
  ScallopConstantsParams & {
    pythEndpoints?: string[];
  };

export type ScallopQueryParams = ScallopUtilsParams & ScallopIndexerParams;

export type ScallopBuilderParams = ScallopQueryParams & {
  usePythPullModel?: boolean;
  useOnChainXOracleList?: boolean;
};

export type ScallopClientParams = ScallopBuilderParams;
export type ScallopParams = SuiKitParams &
  ScallopAddressParams &
  ScallopConstantsParams & {
    walletAddress?: string;
  };
