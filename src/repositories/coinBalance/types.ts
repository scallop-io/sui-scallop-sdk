import type { QueryClient } from '@tanstack/query-core';
import { BaseContext, BaseRepoParams } from '../types.js';
import { AddressesInterface } from 'src/types/address.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { GraphQLDataSource } from 'src/datasources/graphql.js';

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
  onchain: OnChainDataSource;
  /**
   * GraphQL-backed, self-caching balance datasource. Owns `multiGetBalances`
   * (fetch a known set of coin types in one round trip) and namespaces the
   * per-coin balance cache via its `.url`. The gRPC `onchain` above stays the
   * source for the paged `listBalances`/`getBalance` reads.
   */
  balanceSource: GraphQLDataSource;
  queryClient: QueryClient;
  metadata: CoinBalanceMetadata;
};

export type CoinBalanceRepoParams = BaseRepoParams & {
  onchain: OnChainDataSource;
  balanceSource: GraphQLDataSource;
  metadata: CoinBalanceMetadata;
};
