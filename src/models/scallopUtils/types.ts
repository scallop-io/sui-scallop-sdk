import { Logger } from 'src/logger/Logger.js';
import { ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client';
import type { SuiGraphQLClient } from '@mysten/sui/graphql';
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
  /**
   * On-chain read transport when no explicit `suiClient` is injected.
   * `'grpc'` (default) builds a `SuiGrpcClient` against `fullnodeUrl`;
   * `'graphql'` builds a `SuiGraphQLClient` against `graphqlUrl`. Because the
   * Sui Core API is transport-agnostic, every repository read works over either.
   */
  readTransport?: 'grpc' | 'graphql';
  /**
   * Sui GraphQL endpoint. Used to build the read client when
   * `readTransport: 'graphql'`, and by the GraphQL balance datasource. Defaults
   * to mainnet. Ignored when `graphqlClient` is provided.
   */
  graphqlUrl?: string;
  /**
   * Preconfigured `SuiGraphQLClient` (full transport override). Takes precedence
   * over `graphqlUrl` for both the read client (`readTransport: 'graphql'`) and
   * the GraphQL balance datasource.
   */
  graphqlClient?: SuiGraphQLClient;
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
