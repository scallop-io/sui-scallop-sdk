/**
 * coin balance by address
 * total supply of scoin
 */

import { BaseRepository } from '../base.js';
import {
  getCoinAmountFromOnChain,
  getCoinAmountsFromOnChain,
  getMarketCoinAmount,
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
  declare protected readonly metadata: CoinBalanceMetadata;

  constructor(args: CoinBalanceRepoArgs) {
    super(args);
  }

  get context() {
    return {
      ...this.baseContext,
      queryClient: this.queryClient,
      metadata: this.metadata,
    };
  }

  getCoinAmounts({
    coinNames,
    address,
  }: {
    coinNames?: string[];
    address: string;
  }) {
    return getCoinAmountsFromOnChain(this.context, {
      coinNames,
      address,
    });
  }

  getCoinAmount({ coinName, address }: { coinName: string; address: string }) {
    return getCoinAmountFromOnChain(this.context, {
      coinName,
      address,
    });
  }

  getSCoinAmounts({
    sCoinNames,
    address,
  }: {
    sCoinNames?: string[];
    address: string;
  }) {
    return getSCoinAmountsFromOnChain(this.context, {
      sCoinNames,
      address,
    });
  }

  getSCoinAmount({
    sCoinName,
    address,
  }: {
    sCoinName: string;
    address: string;
  }) {
    return getSCoinAmountFromOnChain(this.context, {
      sCoinName,
      address,
    });
  }

  getSCoinTotalSupply(sCoinName: string) {
    return querySCoinTotalSupplyFromOnChain(this.context, sCoinName);
  }

  getMarketCoinAmounts({
    marketCoinNames,
    address,
  }: {
    marketCoinNames?: string[];
    address: string;
  }) {
    return getMarketCoinAmountsFromOnChain(this.context, {
      marketCoinNames,
      address,
    });
  }

  getMarketCoinAmount({
    marketCoinName,
    address,
  }: {
    marketCoinName: string;
    address: string;
  }) {
    return getMarketCoinAmount(this.context, {
      marketCoinName,
      address,
    });
  }
}
