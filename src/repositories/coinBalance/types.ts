import type { QueryClient } from '@tanstack/query-core';
import type { SuiGraphQLClient } from '@mysten/sui/graphql';
import { BaseContext, BaseRepoParams } from '../types.js';
import { AddressesInterface } from 'src/types/address.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';

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
   * GraphQL-backed transport used as the PRIMARY source for balance reads
   * (getBalance/listBalances); the gRPC `onchain` above is the fallback. See
   * GRAPHQL_COINBALANCE_PLAN.md — the gRPC balance service flaps, GraphQL is
   * stable.
   */
  balanceSource: OnChainDataSource;
  /**
   * Raw GraphQL client for typed queries that have no transport-method
   * equivalent — currently `multiGetBalances` (fetch a known set of coin types
   * in one round trip, vs. paging all balances via `listBalances`).
   */
  graphqlClient: SuiGraphQLClient;
  queryClient: QueryClient;
  metadata: CoinBalanceMetadata;
};

export type CoinBalanceRepoParams = BaseRepoParams & {
  onchain: OnChainDataSource;
  balanceSource: OnChainDataSource;
  graphqlClient: SuiGraphQLClient;
  metadata: CoinBalanceMetadata;
};
