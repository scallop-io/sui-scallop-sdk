export type PoolAddress = {
  coinName: string;
  symbol: string;
  coinType: string;
  lendingPoolAddress: string;
  borrowDynamic: string;
  interestModel: string;
  borrowFeeKey: string;
  coinMetadataId: string;
  decimals: number;
  pythFeed: string;
  pythFeedObjectId: string;
  // optional keys
  flashloanFeeObject?: string;
  coinGeckoId?: string;
  collateralPoolAddress?: string; // not all pool has collateral
  riskModel?: string;
  supplyLimitKey?: string;
  borrowLimitKey?: string;
  sCoinType?: string;
  sCoinName?: string;
  sCoinSymbol?: string;
  sCoinMetadataId?: string;
  sCoinTreasury?: string;
  isolatedAssetKey?: string;
  spool?: string;
  spoolReward?: string;
  spoolName?: string;
};

export type Whitelist = {
  lending: Set<string>;
  borrowing: Set<string>;
  collateral: Set<string>;
  packages: Set<string>;
  spool: Set<string>;
  scoin: Set<string>;
  suiBridge: Set<string>;
  wormhole: Set<string>;
  oracles: Set<string>;
  borrowIncentiveRewards: Set<string>;
  pythEndpoints: Set<string>;
};

export type CoinWrappedType =
  | {
      from: string;
      type: string;
    }
  | undefined;
