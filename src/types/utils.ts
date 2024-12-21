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
  lendingPoolAddress?: string;
  collateralPoolAddress?: string; // not all pool has collateral
  borrowDynamic?: string;
  interestModelId?: string;
  borrowFeeKey?: string;
  supplyLimitKey?: string;
  borrowLimitKey?: string;
  isolatedAssetKey?: string;
  sCoinAddress: string | undefined;
  marketCoinAddress: string;
  sCoinName: string | undefined;
};
