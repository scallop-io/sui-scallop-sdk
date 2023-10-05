import type { SupportAssetCoins } from './constant';

type OptionalKeys<T> = {
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
