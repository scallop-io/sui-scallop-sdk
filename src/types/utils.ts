import type { SupportCoins } from './constant';

export type PriceMap = Map<
  SupportCoins,
  {
    price: number;
    publishTime: number;
  }
>;
