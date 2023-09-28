import type { SupportCoins } from './data';

export type PriceMap = Map<
  SupportCoins,
  {
    price: number;
    publishTime: number;
  }
>;
