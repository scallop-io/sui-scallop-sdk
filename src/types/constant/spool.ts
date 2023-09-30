import { SUPPORT_SPOOLS, SUPPORT_REWARD_POOLS } from '../../constants';

export type SupportStakeMarketCoins = (typeof SUPPORT_SPOOLS)[number];
export type SupportRewardCoins = (typeof SUPPORT_REWARD_POOLS)[number];

export type RewardType = {
  [key in SupportStakeMarketCoins]: SupportRewardCoins;
};
