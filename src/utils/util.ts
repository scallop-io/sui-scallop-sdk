import type { PriceFeed } from '@pythnetwork/pyth-sui-js';
import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_SPOOLS_REWARDS,
  MAX_LOCK_DURATION,
  SUPPORT_BORROW_INCENTIVE_REWARDS,
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
        ...SUPPORT_BORROW_INCENTIVE_REWARDS,
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
    ...new Set([
      ...SUPPORT_POOLS,
      ...SUPPORT_COLLATERALS,
      ...SUPPORT_SPOOLS_REWARDS,
      ...SUPPORT_BORROW_INCENTIVE_REWARDS,
    ]),
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
 * Find the closest unlock round timestamp (12AM) to the given unlock at timestamp in seconds.
 *
 * @param unlockAtInSecondTimestamp - Unlock at in seconds timestamp to find the closest round.
 * @returns Closest round (12AM) in seconds timestamp.
 */
export const findClosestUnlockRound = (unlockAtInSecondTimestamp: number) => {
  const unlockDate = new Date(unlockAtInSecondTimestamp * 1000);
  const closestTwelveAM = new Date(unlockAtInSecondTimestamp * 1000);

  closestTwelveAM.setUTCHours(0, 0, 0, 0); // Set the time to the next 12 AM UTC

  // If the current time is past 12 AM, set the date to the next day
  if (unlockDate.getUTCHours() >= 0) {
    closestTwelveAM.setUTCDate(closestTwelveAM.getUTCDate() + 1);
  }

  const now = new Date().getTime();
  // check if unlock period > 4 years
  if (closestTwelveAM.getTime() - now > MAX_LOCK_DURATION * 1000) {
    closestTwelveAM.setUTCDate(closestTwelveAM.getUTCDate() - 1);
  }
  return Math.floor(closestTwelveAM.getTime() / 1000);
};
