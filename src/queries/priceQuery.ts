import { SuiObjectData } from '@mysten/sui/src/client';
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
  const pythPriceFeedIds = assetCoinNames.reduce(
    (prev, assetCoinName) => {
      const pythPriceFeed = query.address.get(
        `core.coins.${assetCoinName}.oracle.pyth.feedObject`
      );
      if (!prev[pythPriceFeed]) {
        prev[pythPriceFeed] = [assetCoinName];
      } else {
        prev[pythPriceFeed].push(assetCoinName);
      }
      return prev;
    },
    {} as Record<string, SupportAssetCoins[]>
  );

  // Fetch multiple objects at once to save rpc calls
  const priceFeedObjects = await query.cache.queryGetObjects(
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
            query,
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
