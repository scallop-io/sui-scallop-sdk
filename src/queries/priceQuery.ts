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
  assetCoinName: SupportAssetCoins
) => {
  const pythFeedObjectId = query.address.get(
    `core.coins.${assetCoinName}.oracle.pyth.feedObject`
  );
  const priceFeedObjectResponse = await query.suiKit.client().getObject({
    id: pythFeedObjectId,
    options: {
      showContent: true,
    },
  });

  if (priceFeedObjectResponse.data) {
    const priceFeedPoolObject = priceFeedObjectResponse.data;
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
