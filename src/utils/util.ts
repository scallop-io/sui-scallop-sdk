import { SUPPORT_POOLS, SUPPORT_COLLATERALS } from '../constants';
import type { SupportCoins, SupportMarketCoins } from '../types';

export const isMarketCoin = (
  coin: SupportCoins | SupportMarketCoins
): coin is SupportMarketCoins => {
  return [...new Set([...SUPPORT_POOLS, ...SUPPORT_COLLATERALS])].includes(
    coin.slice(1) as SupportCoins
  );
};
