import type { QueryClient } from '@tanstack/query-core';
import { BaseContext, BaseRepoParams } from '../types.js';
import { AddressesInterface } from 'src/types/address.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { GraphQLDataSource } from 'src/datasources/graphql/index.js';

export type CoinBalanceMetadata = {
  whitelist: {
    lending: ReadonlySet<string>;
    scoin: ReadonlySet<string>;
  };
  addresses: {
    scoin: AddressesInterface['scoin'];
  };
  parseCoinType: (coinName: string) => string | undefined;
  parseSCoinType: (sCoinName: string) => string | undefined;
  parseMarketCoinType: (coinName: string) => string | undefined;
  parseSCoinNameFromType: (sCoinType: string) => string | undefined;
  parseUnderlyingSCoinType: (sCoinName: string) => string | undefined;
  getSCoinTreasury: (sCoinName: string) => string | undefined;
  getCoinDecimal: (coinName: string) => number | undefined;
  parseCoinName: (marketCoinName: string) => string | undefined;
};

export type CoinBalanceContext = BaseContext & {
  grpc: GrpcDataSource;
  /**
   * GraphQL-backed, self-caching balance datasource. Owns `multiGetBalances`
   * (fetch a known set of coin types in one round trip) and namespaces the
   * per-coin balance cache via its `.url`. The gRPC `onchain` above stays the
   * source for the paged `listBalances`/`getBalance` reads.
   */
  balanceSource: GraphQLDataSource;
  queryClient: QueryClient;
  metadata: CoinBalanceMetadata;
  /**
   * Prefer the GraphQL `multiGetBalances` read (with gRPC `listBalances`
   * fallback) over reading balances straight from the gRPC fullnode. Mirrors the
   * selected read transport: on `graphql` the indexed multi-get is cheaper; on
   * `grpc` the fullnode is read directly so balances are fresh immediately after
   * a write (the GraphQL indexer trails the fullnode by a checkpoint or two).
   */
  preferGraphql: boolean;
};

export type CoinBalanceRepoParams = BaseRepoParams & {
  grpc: GrpcDataSource;
  balanceSource: GraphQLDataSource;
  metadata: CoinBalanceMetadata;
  preferGraphql: boolean;
};
