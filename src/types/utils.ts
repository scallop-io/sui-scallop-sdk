import type { SupportCoins } from './constant';

export type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type CoinPrices = OptionalKeys<Record<SupportCoins, number>>;

export type PoolAddressInfo = {
  name: string;
  coingeckoId: string;
  decimal: number;
  pythFeedId: string;
  lendingPoolAddress: string;
  collateralPoolAddress?: string;
  sCoinAddress: string | undefined;
  marketCoinAddress: string;
  coinAddress: string;
  sCoinName: string | undefined;
};
