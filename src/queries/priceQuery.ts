import { SuiObjectData } from '@mysten/sui/client';
import { ScallopConstants } from 'src/models';
import type { ScallopQuery, ScallopSuiKit } from 'src/models';
import type { CoinPrices, MarketPools, OptionalKeys } from '../types';
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
    constants,
    scallopSuiKit,
  }: {
    constants: ScallopConstants;
    scallopSuiKit: ScallopSuiKit;
  },
  assetCoinName: string,
  priceFeedObject?: SuiObjectData | null
) => {
  const pythFeedObjectId = constants.get(
    `core.coins.${assetCoinName}.oracle.pyth.feedObject`
  );
  priceFeedObject =
    priceFeedObject ||
    (await scallopSuiKit.queryGetObject(pythFeedObjectId))?.data;

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
    constants,
    scallopSuiKit,
  }: {
    constants: ScallopConstants;
    scallopSuiKit: ScallopSuiKit;
  },
  assetCoinNames: string[]
) => {
  const pythPriceFeedIds = assetCoinNames.reduce(
    (prev, assetCoinName) => {
      const pythPriceFeed = constants.get(
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
    {} as Record<string, string[]>
  );

  // Fetch multiple objects at once to save rpc calls
  const priceFeedObjects = await scallopSuiKit.queryGetObjects(
    Object.keys(pythPriceFeedIds)
  );

  const assetToPriceFeedMapping = priceFeedObjects.reduce(
    (prev, priceFeedObject) => {
      pythPriceFeedIds[priceFeedObject.objectId].forEach((assetCoinName) => {
        prev[assetCoinName] = priceFeedObject;
      });
      return prev;
    },
    {} as Record<string, SuiObjectData>
  );

  return (
    await Promise.all(
      Object.entries(assetToPriceFeedMapping).map(
        async ([assetCoinName, priceFeedObject]) => ({
          coinName: assetCoinName,
          price: await getPythPrice(
            {
              constants,
              scallopSuiKit,
            },
            assetCoinName as string,
            priceFeedObject
          ),
        })
      )
    )
  ).reduce(
    (prev, curr) => {
      prev[curr.coinName as string] = curr.price;
      return prev;
    },
    {} as Record<string, number>
  );
};

export const getAllCoinPrices = async (
  query: ScallopQuery,
  marketPools?: MarketPools,
  coinPrices?: CoinPrices,
  indexer: boolean = false
) => {
  coinPrices =
    coinPrices ??
    (indexer
      ? await query.getCoinPricesByIndexer()
      : await query.utils.getCoinPrices());

  marketPools =
    marketPools ??
    (await query.getMarketPools(undefined, { coinPrices, indexer })).pools;

  if (!marketPools) {
    throw new Error(`Failed to fetch market pool for getAllCoinPrices`);
  }

  const sCoinPrices: OptionalKeys<Record<string, number>> = {};
  query.address.getWhitelist('scoin').forEach((sCoinName) => {
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
