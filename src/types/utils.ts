import type { SupportAssetCoins } from './constant';

export type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type CoinPrices = OptionalKeys<Record<SupportAssetCoins, number>>;

export type PriceMap = Map<
  SupportAssetCoins,
  {
    price: number;
    publishTime: number;
  }
>;

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
