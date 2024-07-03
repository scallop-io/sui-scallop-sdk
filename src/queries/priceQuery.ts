import { SuiObjectData } from '@mysten/sui.js/src/client';
import type { ScallopQuery } from '../models';
import type { SupportAssetCoins } from '../types';

/**
 * Get price from pyth fee object.
 *
 * @param query - The Scallop query instance.
 * @param assetCoinName - Specific support asset coin name.
 * @return Asset coin price.
 */
export const getPythPrice = async (
  query: ScallopQuery,
  assetCoinName: SupportAssetCoins,
  priceFeedObject?: SuiObjectData | null
) => {
  const pythFeedObjectId = query.address.get(
    `core.coins.${assetCoinName}.oracle.pyth.feedObject`
  );
  priceFeedObject =
    priceFeedObject ||
    (await query.cache.queryGetObject(pythFeedObjectId, { showContent: true }))
      ?.data;

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
  query: ScallopQuery,
  assetCoinNames: SupportAssetCoins[]
) => {
  const seen: Record<string, boolean> = {};
  const pythFeedObjectIds = assetCoinNames
    .map((assetCoinName) => {
      const pythFeedObjectId = query.address.get(
        `core.coins.${assetCoinName}.oracle.pyth.feedObject`
      );
      if (seen[pythFeedObjectId]) return null;

      seen[pythFeedObjectId] = true;
      return pythFeedObjectId;
    })
    .filter((item) => !!item) as string[];
  const priceFeedObjects = await query.cache.queryGetObjects(
    pythFeedObjectIds,
    {
      showContent: true,
    }
  );

  return (
    await Promise.all(
      priceFeedObjects.map(async (priceFeedObject, idx) => ({
        coinName: assetCoinNames[idx],
        price: await getPythPrice(query, assetCoinNames[idx], priceFeedObject),
      }))
    )
  ).reduce(
    (prev, curr) => {
      prev[curr.coinName] = curr.price;
      return prev;
    },
    {} as Record<SupportAssetCoins, number>
  );
};
