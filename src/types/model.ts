import type { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import type {
  TransactionBlock,
  TransactionResult,
} from '@mysten/sui.js/transactions';
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

export type ScallopClientFnReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : TransactionBlock;

export type ScallopClientVeScaReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : {
      tx: TransactionBlock;
      scaCoin: TransactionResult;
    };

export type ScallopBaseInstanceParams = {
  suiKit?: SuiKit;
};

export type ScallopCacheInstanceParams = ScallopBaseInstanceParams;

export type ScallopAddressInstanceParams = ScallopBaseInstanceParams & {
  cache?: ScallopCache;
};

export type ScallopIndexerInstanceParams = {
  cache?: ScallopCache;
};

export type ScallopUtilsInstanceParams = ScallopBaseInstanceParams & {
  address?: ScallopAddress;
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

export type ScallopAddressParams = {
  id: string;
  auth?: string;
  network?: NetworkType;
  forceInterface?: Record<NetworkType, AddressesInterface>;
};

export type ScallopParams = {
  addressesId?: string;
  forceAddressesInterface?: Record<NetworkType, AddressesInterface>;
  walletAddress?: string;
} & SuiKitParams;

export type ScallopClientParams = ScallopParams &
  ScallopBuilderParams &
  ScallopQueryParams &
  ScallopUtilsParams;

export type ScallopBuilderParams = ScallopParams & {
  pythEndpoints?: string[];
  usePythPullModel?: boolean;
} & ScallopQueryParams;

export type ScallopQueryParams = ScallopParams & ScallopUtilsParams;

export type ScallopUtilsParams = ScallopParams & {
  pythEndpoints?: string[];
};
