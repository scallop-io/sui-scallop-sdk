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
