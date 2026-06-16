/**
 * coin balance by address
 * total supply of scoin
 */

import { BaseRepository } from '../base.js';
import {
  getCoinAmountFromOnChain,
  getCoinAmountsFromOnChain,
  getMarketCoinAmountFromOnChain,
  getMarketCoinAmountsFromOnChain,
  getSCoinAmountFromOnChain,
  getSCoinAmountsFromOnChain,
  querySCoinTotalSupplyFromOnChain,
} from './helpers.js';
import {
  CoinBalanceContext,
  CoinBalanceMetadata,
  CoinBalanceRepoArgs,
} from './types.js';

export class CoinBalanceRepository extends BaseRepository<
  CoinBalanceContext,
  CoinBalanceMetadata
> {
  constructor(args: CoinBalanceRepoArgs) {
    super(args);
  }

  get context() {
    return {
      ...this.baseContext,
      queryClient: this.queryClient,
    };
  }

  getCoinAmounts(args: { coinNames?: string[]; address: string }) {
    return getCoinAmountsFromOnChain(this.context, args);
  }

  getCoinAmount(args: { coinName: string; address: string }) {
    return getCoinAmountFromOnChain(this.context, args);
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
