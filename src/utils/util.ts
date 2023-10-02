import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_REWARD_POOLS,
} from '../constants';
import type {
  SupportCoins,
  SupportMarketCoins,
  SupportRewardCoins,
} from '../types';

export const isMarketCoin = (
  coin: SupportCoins | SupportMarketCoins | SupportRewardCoins
): coin is SupportMarketCoins => {
  return [
    ...new Set([
      ...SUPPORT_POOLS,
      ...SUPPORT_COLLATERALS,
      ...SUPPORT_REWARD_POOLS,
    ]),
  ].includes(coin.slice(1) as SupportCoins);
};
