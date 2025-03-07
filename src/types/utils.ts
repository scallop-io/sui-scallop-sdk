import type { SupportCoins } from './constant';

export type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type CoinPrices = OptionalKeys<Record<SupportCoins, number>>;
