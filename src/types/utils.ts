import type { SupportCoins } from './constant';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type CoinPrices = OptionalKeys<Record<SupportCoins, number>>;

export type PriceMap = Map<
  SupportCoins,
  {
    price: number;
    publishTime: number;
  }
>;
