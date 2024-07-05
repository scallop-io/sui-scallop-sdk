import {
  SupportCoins,
  SupportAssetCoins,
  SupportMarketCoins,
  SupportStakeMarketCoins,
  SupportStakeRewardCoins,
  SupportBorrowIncentiveCoins,
  SupportBorrowIncentiveRewardCoins,
  SupportSCoin,
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

export type SCoins = {
  [K in SupportSCoin]: K;
};

export type StakeMarketCoins = {
  [K in SupportStakeMarketCoins]: K;
};

export type StakeRewardCoins = {
  [key in SupportStakeMarketCoins]: SupportStakeRewardCoins;
};

export type BorrowIncentiveRewardCoins = {
  [key in SupportBorrowIncentiveCoins]: SupportBorrowIncentiveRewardCoins[];
};

export type AssetCoinIds = {
  [key in SupportAssetCoins]: string;
};

export type SCoinIds = {
  [key in SupportSCoin]: string;
};

export type SCoinTreasuryCaps = {
  [key in SupportSCoin]: string;
};

export type SCoinConverterTreasury = {
  [key in SupportSCoin]: string;
};

type PickFromUnion<T, K extends string> = K extends T ? K : never;

export type WormholeCoinIds = {
  [key in PickFromUnion<
    SupportAssetCoins,
    'eth' | 'btc' | 'usdc' | 'usdt' | 'apt' | 'sol'
  >]: string;
};

export type VoloCoinIds = {
  [key in PickFromUnion<SupportAssetCoins, 'vsui'>]: string;
};
