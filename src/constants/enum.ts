import type {
  SupportCoinDecimals,
  AssetCoins,
  MarketCoins,
  StakeMarketCoins,
  RewardCoins,
} from '../types';

export const coinDecimals: SupportCoinDecimals = {
  eth: 8,
  btc: 8,
  usdc: 6,
  usdt: 6,
  sui: 9,
  apt: 8,
  sol: 8,
  cetus: 9,
  seth: 8,
  sbtc: 8,
  susdc: 6,
  susdt: 6,
  ssui: 9,
  sapt: 8,
  ssol: 8,
  scetus: 9,
};

export const assetCoins: AssetCoins = {
  eth: 'eth',
  btc: 'btc',
  usdc: 'usdc',
  usdt: 'usdt',
  sui: 'sui',
  apt: 'apt',
  sol: 'sol',
  cetus: 'cetus',
};

export const marketCoins: MarketCoins = {
  seth: 'seth',
  sbtc: 'sbtc',
  susdc: 'susdc',
  susdt: 'susdt',
  ssui: 'ssui',
  sapt: 'sapt',
  ssol: 'ssol',
  scetus: 'scetus',
};

export const stakeMarketCoins: StakeMarketCoins = {
  ssui: 'ssui',
  susdc: 'susdc',
  susdt: 'susdt',
};

export const rewardCoins: RewardCoins = {
  ssui: 'sui',
  susdc: 'sui',
  susdt: 'sui',
};
