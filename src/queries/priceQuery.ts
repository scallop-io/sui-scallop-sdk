import { SuiObjectData } from '@mysten/sui/client';
import type { ScallopAddress, ScallopQuery } from '../models';
import type {
  CoinPrices,
  MarketPools,
  OptionalKeys,
  SupportAssetCoins,
  SupportSCoin,
} from '../types';
import { SUPPORT_SCOIN } from 'src/constants/common';
import BigNumber from 'bignumber.js';

/**
 * Get price from pyth fee object.
 *
 * @param query - The Scallop query instance.
 * @param assetCoinName - Specific support asset coin name.
 * @return Asset coin price.
 */
export const getPythPrice = async (
  {
    address,
  }: {
    address: ScallopAddress;
  },
  assetCoinName: SupportAssetCoins,
  priceFeedObject?: SuiObjectData | null
) => {
  const pythFeedObjectId = address.get(
    `core.coins.${assetCoinName}.oracle.pyth.feedObject`
  );
  priceFeedObject =
    priceFeedObject ||
    (
      await address.cache.queryGetObject(pythFeedObjectId, {
        showContent: true,
      })
    )?.data;

  if (priceFeedObject) {
    const priceFeedPoolObject = priceFeedObject;
    if (
      priceFeedPoolObject.content &&
      'fields' in priceFeedPoolObject.content
    ) {
      const fields = priceFeedPoolObject.content.fields as any;
      const expoMagnitude = Number(
        fields.price_info.fields.price_feed.fields.price.fields.expo.fields
          .magnitude
      );
      const expoNegative = Number(
        fields.price_info.fields.price_feed.fields.price.fields.expo.fields
          .negative
      );
      const priceMagnitude = Number(
        fields.price_info.fields.price_feed.fields.price.fields.price.fields
          .magnitude
      );
      const priceNegative = Number(
        fields.price_info.fields.price_feed.fields.price.fields.price.fields
          .negative
      );

      return (
        priceMagnitude *
        10 ** ((expoNegative ? -1 : 1) * expoMagnitude) *
        (priceNegative ? -1 : 1)
      );
    }
  }

  return 0;
};

export const getPythPrices = async (
  {
    address,
  }: {
    address: ScallopAddress;
  },
  assetCoinNames: SupportAssetCoins[]
) => {
  const pythPriceFeedIds = assetCoinNames.reduce(
    (prev, assetCoinName) => {
      const pythPriceFeed = address.get(
        `core.coins.${assetCoinName}.oracle.pyth.feedObject`
      );
      if (pythPriceFeed) {
        if (!prev[pythPriceFeed]) {
          prev[pythPriceFeed] = [assetCoinName];
        } else {
          prev[pythPriceFeed].push(assetCoinName);
        }
      }
      return prev;
    },
    {} as Record<string, SupportAssetCoins[]>
  );

  // Fetch multiple objects at once to save rpc calls
  const priceFeedObjects = await address.cache.queryGetObjects(
    Object.keys(pythPriceFeedIds),
    { showContent: true }
  );

  const assetToPriceFeedMapping = priceFeedObjects.reduce(
    (prev, priceFeedObject) => {
      pythPriceFeedIds[priceFeedObject.objectId].forEach((assetCoinName) => {
        prev[assetCoinName] = priceFeedObject;
      });
      return prev;
    },
    {} as Record<SupportAssetCoins, SuiObjectData>
  );

  return (
    await Promise.all(
      Object.entries(assetToPriceFeedMapping).map(
        async ([assetCoinName, priceFeedObject]) => ({
          coinName: assetCoinName,
          price: await getPythPrice(
            { address },
            assetCoinName as SupportAssetCoins,
            priceFeedObject
          ),
        })
      )
    )
  ).reduce(
    (prev, curr) => {
      prev[curr.coinName as SupportAssetCoins] = curr.price;
      return prev;
    },
    {} as Record<SupportAssetCoins, number>
  );
};

export const getAllCoinPrices = async (
  query: ScallopQuery,
  marketPools?: MarketPools,
  coinPrices?: CoinPrices
) => {
  coinPrices = coinPrices ?? (await query.utils.getCoinPrices());
  marketPools =
    marketPools ?? (await query.getMarketPools(undefined, { coinPrices }));
  if (!marketPools) {
    throw new Error(`Failed to fetch market pool for getAllCoinPrices`);
  }
  const sCoinPrices: OptionalKeys<Record<SupportSCoin, number>> = {};
  SUPPORT_SCOIN.forEach((sCoinName) => {
    const coinName = query.utils.parseCoinName(sCoinName);
    sCoinPrices[sCoinName] = BigNumber(coinPrices[coinName] ?? 0)
      .multipliedBy(marketPools[coinName]?.conversionRate ?? 1)
      .toNumber();
  });

  return {
    ...coinPrices,
    ...sCoinPrices,
  };
};
