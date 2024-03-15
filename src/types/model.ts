import type { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import type { TransactionBlock } from '@mysten/sui.js/transactions';
import type { SuiKit, SuiKitParams, NetworkType } from '@scallop-io/sui-kit';
import type {
  ScallopAddress,
  ScallopQuery,
  ScallopUtils,
  ScallopBuilder,
} from '../models';
import { ScallopCache } from 'src/models/scallopCache';

export type ScallopClientFnReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : TransactionBlock;

export type ScallopInstanceParams = {
  suiKit?: SuiKit;
  address?: ScallopAddress;
  query?: ScallopQuery;
  utils?: ScallopUtils;
  builder?: ScallopBuilder;
  cache: ScallopCache;
};

export type ScallopAddressParams = {
  id: string;
  auth?: string;
  network?: NetworkType;
};

export type ScallopParams = {
  addressesId?: string;
} & SuiKitParams;

export type ScallopClientParams = ScallopParams & {
  walletAddress?: string;
};

export type ScallopBuilderParams = ScallopParams & {
  walletAddress?: string;
  pythEndpoints?: string[];
};

export type ScallopQueryParams = ScallopParams;

export type ScallopUtilsParams = ScallopParams & {
  pythEndpoints?: string[];
};
