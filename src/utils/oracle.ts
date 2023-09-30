import { SUPPORT_POOLS, SUPPORT_COLLATERALS } from '../constants';
import type { PriceFeed } from '@pythnetwork/pyth-sui-js';
import type { ScallopAddress } from '../models';

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
  const coinNames = [...new Set([...SUPPORT_POOLS, ...SUPPORT_COLLATERALS])];
  const coinName = coinNames.find((coinName) => {
    return address.get(`core.coins.${coinName}.oracle.pyth.feed`) === feed.id;
  });
  if (coinName) {
    const price = feed.price.price * 10 ** feed.price.expo;

    return {
      coinName,
      price,
      publishTime: Number(feed.price.publishTime) * 10 ** 3,
    };
  } else {
    throw new Error('Invalid feed id');
  }
};