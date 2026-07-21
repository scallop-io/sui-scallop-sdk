/**
 * coin balance by address
 * total supply of scoin
 */

import { BaseRepository } from '../base.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { GraphQLDataSource } from 'src/datasources/graphql.js';
import {
  getCoinAmountFromOnChain,
  getCoinAmountsFromOnChain,
  getCoinBalancesFromGraphQL,
  getMarketCoinAmountFromOnChain,
  getMarketCoinAmountsFromOnChain,
  getSCoinAmountFromOnChain,
  getSCoinAmountsFromOnChain,
  querySCoinTotalSupplyFromOnChain,
} from './helpers.js';
import {
  CoinBalanceContext,
  CoinBalanceMetadata,
  CoinBalanceRepoParams,
} from './types.js';

export class CoinBalanceRepository extends BaseRepository<
  CoinBalanceContext,
  CoinBalanceMetadata
> {
  private readonly onchain: OnChainDataSource;
  private readonly balanceSource: GraphQLDataSource;
  private readonly preferGraphql: boolean;

  constructor({
    onchain,
    balanceSource,
    preferGraphql,
    ...params
  }: CoinBalanceRepoParams) {
    super(params);
    this.onchain = onchain;
    this.balanceSource = balanceSource;
    this.preferGraphql = preferGraphql;
  }

  get context() {
    return {
      ...this.baseContext,
      onchain: this.onchain,
      balanceSource: this.balanceSource,
      preferGraphql: this.preferGraphql,
      queryClient: this.queryClient,
    };
  }

  getCoinAmounts(args: { coinNames?: string[]; address: string }) {
    return getCoinAmountsFromOnChain(this.context, args);
  }

  getCoinAmount(args: { coinName: string; address: string }) {
    return getCoinAmountFromOnChain(this.context, args);
  }

  /**
   * Fetch balances for a specific set of coin types in one GraphQL round trip
   * (`multiGetBalances`), instead of paging every balance via `listBalances`.
   * Returns a map keyed by normalized coin type; types absent on-chain are
   * omitted. GraphQL-only (no gRPC fallback).
   */
  getCoinBalances(args: { coinTypes: string[]; address: string }) {
    return getCoinBalancesFromGraphQL(this.context, args);
  }

  getSCoinAmounts(args: { sCoinNames?: string[]; address: string }) {
    return getSCoinAmountsFromOnChain(this.context, args);
  }

  getSCoinAmount(args: { sCoinName: string; address: string }) {
    return getSCoinAmountFromOnChain(this.context, args);
  }

  getSCoinTotalSupply(sCoinName: string) {
    return querySCoinTotalSupplyFromOnChain(this.context, sCoinName);
  }

  getMarketCoinAmounts(args: { marketCoinNames?: string[]; address: string }) {
    return getMarketCoinAmountsFromOnChain(this.context, args);
  }

  getMarketCoinAmount(args: { marketCoinName: string; address: string }) {
    return getMarketCoinAmountFromOnChain(this.context, args);
  }
}
