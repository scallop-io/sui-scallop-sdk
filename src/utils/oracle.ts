import { SUPPORT_POOLS, SUPPORT_COLLATERALS } from '../constants';
import type { PriceFeed } from '@pythnetwork/pyth-sui-js';
import type { ScallopAddress } from '../models';
import type { SupportAssetCoins } from '../types';

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
