import {
  SupportCoins,
  SupportAssetCoins,
  SupportMarketCoins,
  SupportStakeMarketCoins,
  SupportRewardCoins,
} from './common';

export type Coins = {
  [K in SupportCoins]: K;
};

export type AssetCoins = {
  [K in SupportAssetCoins]: K;
};

export type MarketCoins = {
  [K in SupportMarketCoins]: K;
};

export type StakeMarketCoins = {
  [K in SupportStakeMarketCoins]: K;
};

export type RewardCoins = {
  [key in SupportStakeMarketCoins]: SupportRewardCoins;
};

export type AssetCoinIds = {
  [key in SupportAssetCoins]: string;
};

type PickFromUnion<T, K extends string> = K extends T ? K : never;

export type WormholeCoinIds = {
  [key in PickFromUnion<
    SupportAssetCoins,
    'eth' | 'btc' | 'usdc' | 'usdt' | 'apt' | 'sol'
  >]: string;
};
