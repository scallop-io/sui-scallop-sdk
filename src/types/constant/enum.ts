export type Coins = {
  [K in string]: K;
};

export type AssetCoins = {
  [K in string]: K;
};

export type MarketCoins = {
  [K in string]: K;
};

export type SCoins = {
  [K in string]: K;
};

export type StakeMarketCoins = {
  [K in string]: K;
};

export type StakeRewardCoins = {
  [key in string]: string;
};

export type SuiBridgeCoins = {
  [K in string]: K;
};

export type BorrowIncentiveRewardCoins = {
  [key in string]: string[];
};

export type AssetCoinIds = {
  [key in string]: string;
};

export type SCoinIds = {
  [key in string]: string;
};

export type SCoinTreasuryCaps = {
  [key in string]: string;
};

export type SCoinConverterTreasury = {
  [key in string]: string;
};

type PickFromUnion<T, K extends string> = K extends T ? K : never;

export type WormholeCoinIds = {
  [key in PickFromUnion<
    string,
    'weth' | 'wbtc' | 'wusdc' | 'wusdt' | 'wapt' | 'wsol'
  >]: string;
};

export type VoloCoinIds = {
  [key in PickFromUnion<string, 'vsui'>]: string;
};

export type SuiBridgedCoinPackageIds = {
  [key in string]: string;
};
