import type { PriceFeed } from '@pythnetwork/pyth-sui-js';
import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_SPOOLS_REWARDS,
  MAX_LOCK_DURATION,
} from '../constants';
import type { ScallopAddress } from '../models';
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
        ...SUPPORT_SPOOLS_REWARDS,
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

/**
 * Parse price from pyth price feed.
 *
 * @param feed  - Price feed object from pyth.
 * @param address - Scallop address instance.
 * @return Price Data inclue coin name, price, and publish time.
 */
export const parseDataFromPythPriceFeed = (
  feed: PriceFeed,
  address: ScallopAddress
) => {
  const assetCoinNames = [
    ...new Set([...SUPPORT_POOLS, ...SUPPORT_COLLATERALS]),
  ] as SupportAssetCoins[];
  const assetCoinName = assetCoinNames.find((assetCoinName) => {
    return (
      address.get(`core.coins.${assetCoinName}.oracle.pyth.feed`) === feed.id
    );
  });
  if (assetCoinName) {
    const price = feed.price.price * 10 ** feed.price.expo;

    return {
      coinName: assetCoinName,
      price,
      publishTime: Number(feed.price.publishTime) * 10 ** 3,
    };
  } else {
    throw new Error('Invalid feed id');
  }
};

/**
 * Find closest 12AM to the given date in seconds.
 * @param date
 * @returns closest 12AM in seconds timestamp
 */
export const findClosest12AM = (date: Date | number) => {
  if (typeof date === 'number') {
    date = new Date(date);
  }
  const closestTwelveAM = new Date(date);

  closestTwelveAM.setUTCHours(0, 0, 0, 0); // Set the time to the next 12 AM UTC

  // If the current time is past 12 AM, set the date to the next day
  if (date.getUTCHours() >= 0) {
    closestTwelveAM.setUTCDate(closestTwelveAM.getUTCDate() + 1);
  }

  const now = new Date().getTime();
  // check if unlock period > 4 years
  if (closestTwelveAM.getTime() / 1000 - now / 1000 > MAX_LOCK_DURATION) {
    closestTwelveAM.setUTCDate(closestTwelveAM.getUTCDate() - 1);
  }
  return Math.floor(closestTwelveAM.getTime() / 1000);
};
