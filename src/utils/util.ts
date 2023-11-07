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
  const assetCoinName = coinName.slice(1).toLowerCase() as SupportAssetCoins;
  return (
    coinName.charAt(0).toLowerCase() === 's' &&
    [
      ...new Set([
        ...SUPPORT_POOLS,
        ...SUPPORT_COLLATERALS,
        ...SUPPORT_REWARD_POOLS,
      ]),
    ].includes(assetCoinName)
  );
};

export const parseAssetSymbol = (coinName: SupportAssetCoins): string => {
  switch (coinName) {
    case 'afsui':
      return 'afSUI';
    case 'hasui':
      return 'haSUI';
    case 'vsui':
      return 'vSUI';
    default:
      return coinName.toUpperCase();
  }
};
