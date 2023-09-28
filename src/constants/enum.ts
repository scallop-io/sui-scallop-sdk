import type { SupportCoinDecimals, RewardType } from '../types';

export const coinDecimals: SupportCoinDecimals = {
  eth: 8,
  btc: 8,
  usdc: 6,
  usdt: 6,
  sui: 9,
  apt: 8,
  sol: 8,
  cetus: 9,
};

export const spoolRewardType: RewardType = {
  ssui: 'sui',
  susdc: 'sui',
  susdt: 'sui',
};
