// import {
//   SUPPORT_POOLS,
//   SUPPORT_COLLATERALS,
//   SUPPORT_ORACLES,
//   SUPPORT_PACKAGES,
//   SUPPORT_SPOOLS,
//   SUPPORT_SPOOLS_REWARDS,
//   SUPPORT_BORROW_INCENTIVE_POOLS,
//   SUPPORT_BORROW_INCENTIVE_REWARDS,
//   SUPPORT_SCOIN,
//   SUPPORT_SUI_BRIDGE,
//   SUPPORT_WORMHOLE,
// } from '../../constants';

// type ParseMarketCoins<T extends string> = `s${T}`;
// type ParseCoins<T extends string> = T extends `s${infer R}` ? R : never;

// export type SupportCoins =
//   | string
//   | string
//   | string
//   | string;
// export type string =
//   | string
//   | string
//   | SupportStakeRewardCoins;
// export type string = (typeof SUPPORT_POOLS)[number];
// export type string = (typeof SUPPORT_COLLATERALS)[number];
// export type string =
//   | ParseMarketCoins<string>
//   | string;
// export type string = (typeof SUPPORT_SPOOLS)[number];
// export type string = (typeof SUPPORT_SUI_BRIDGE)[number];
// export type string = (typeof SUPPORT_WORMHOLE)[number];
// export type string = Extract<
//   string,
//   ParseCoins<string>
// >;
// export type SupportStakeRewardCoins = (typeof SUPPORT_SPOOLS_REWARDS)[number];
// export type string =
//   (typeof SUPPORT_BORROW_INCENTIVE_POOLS)[number];
// export type string =
//   (typeof SUPPORT_BORROW_INCENTIVE_REWARDS)[number];
// export type string = (typeof SUPPORT_SCOIN)[number];

// export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];

// export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];

// export type SupportCoinDecimals = Record<SupportCoins, number>;

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
  spoolType?: string;
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
