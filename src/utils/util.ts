import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_REWARD_POOLS,
} from '../constants';
import type {
  SupportAssetCoins,
  SupportCoins,
  SupportMarketCoins,
} from '../types';

export const isMarketCoin = (
  coinName: SupportCoins
): coinName is SupportMarketCoins => {
  const assetCoinName = coinName.slice(1) as SupportAssetCoins;
  return [
    ...new Set([
      ...SUPPORT_POOLS,
      ...SUPPORT_COLLATERALS,
      ...SUPPORT_REWARD_POOLS,
    ]),
  ].includes(assetCoinName);
};
