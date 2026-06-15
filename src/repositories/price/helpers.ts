import { SuiClientTypes } from '@mysten/sui/client';
import { PriceRepositoryContext } from './types.js';
import type { BaseContext } from '../types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { PriceFeedObjectSchema } from './schema.js';
import { calculatePrice } from './util.js';
import { logError } from '../utils.js';
import { SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import type { SuiObjectData } from 'src/types/index.js';

export const getPythPricesFromApi = async (
  ctx: PriceRepositoryContext,
  coinNames: string[]
) => {
  const {
    fetchWithCache,
    metadata: { addresses },
    pythPriceServiceConfig: { endpoint, config },
  } = ctx;

  // Multiple coins can share the same feed — dedupe before hitting the API.
  const feedIdByCoin = new Map(
    coinNames.map((coinName) => [
      coinName,
      addresses.coins[coinName].oracle.pyth.feed,
    ])
  );
  const priceFeedIds = Array.from(new Set(feedIdByCoin.values()));

  const client = new SuiPriceServiceConnection(endpoint, config);
  const feeds = await client.getLatestPriceFeeds(priceFeedIds);
  if (!feeds) {
    throw logError(
      ctx.logger,
      `Failed to fetch price feeds from Pyth API at ${endpoint} for feeds: ${priceFeedIds.join(', ')}`
    );
  }

  return await fetchWithCache({
    queryKey: queryKeys.oracle.getPythLatestPriceFeeds(endpoint, priceFeedIds),
    queryFn: () => {
      // Resolve each unique feed once, then fan back out to every coin.
      const priceByFeedId = new Map<string, number>();
      for (const feed of feeds) {
        priceByFeedId.set(
          feed.id,
          feed.getPriceUnchecked().getPriceAsNumberUnchecked()
        );
      }

      const prices: Record<string, number> = {};
      for (const [coinName, feedId] of feedIdByCoin) {
        const price = priceByFeedId.get(feedId);
        if (price === undefined) {
          throw logError(
            ctx.logger,
            `Price feed not found for ${coinName} at ${feedId} from Pyth API`
          );
        }
        prices[coinName] = price;
      }
      return prices;
    },
  });
};

/**
 * Fetch a single raw Pyth price-feed object by id (cached). Returns `null` when
 * the object is absent. Parsing is left to the caller — this is the raw-object
 * read the legacy `ScallopUtils.getPythPrice` did via `queryGetObject`.
 */
export const getPythFeedObjectFromOnChain = async (
  ctx: Pick<BaseContext, 'onchain' | 'fetchWithCache'>,
  feedObjectId: string
): Promise<SuiObjectData | null> => {
  const { onchain, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: feedObjectId,
    include: { json: true },
  };
  const { object } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({ ...options, node: onchain.url }),
    queryFn: () => onchain.getObject(options),
  });
  return object ?? null;
};

/**
 * Batch-fetch raw Pyth price-feed objects in ONE getObjects call (cached). The
 * caller keys results by `objectId`, so per-object failures are dropped rather
 * than positioned — matching the legacy `queryGetObjects`, which returned only
 * the successfully-fetched objects.
 */
export const getPythFeedObjectsFromOnChain = async (
  ctx: Pick<BaseContext, 'onchain' | 'fetchWithCache'>,
  feedObjectIds: string[]
): Promise<SuiObjectData[]> => {
  if (feedObjectIds.length === 0) return [];
  const { onchain, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectsOptions<{ json: true }> = {
    objectIds: feedObjectIds,
    include: { json: true },
  };
  const { objects } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObjects({ ...options, node: onchain.url }),
    queryFn: () => onchain.client.getObjects(options),
  });
  return objects.filter((o): o is SuiObjectData => !(o instanceof Error));
};

export const getPythPricesFromOnChain = async (
  ctx: PriceRepositoryContext,
  coinNames: string[]
) => {
  const {
    onchain,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;

  // Multiple coins can share the same feed object — dedupe before fetching.
  const feedObjectByCoin = new Map(
    coinNames.map((coinName) => [
      coinName,
      addresses.coins[coinName].oracle.pyth.feedObject,
    ])
  );
  const feedObjectIds = Array.from(new Set(feedObjectByCoin.values()));

  const fetchOptions: SuiClientTypes.GetObjectsOptions<{ json: true }> = {
    objectIds: feedObjectIds,
    include: {
      json: true,
    },
  };

  const { objects: priceFeedObjects } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObjects({ ...fetchOptions, node: onchain.url }),
    queryFn: () => onchain.client.getObjects(fetchOptions),
  });

  // Parse each unique feed object once, keyed by its object id.
  const priceByFeedObject = new Map<string, number>();
  for (const priceFeedObject of priceFeedObjects) {
    if (priceFeedObject instanceof Error) {
      ctx.logger?.error('Failed to fetch price feed object on chain', {
        cause: priceFeedObject.message,
      });
      throw priceFeedObject;
    }

    const { data, success } = PriceFeedObjectSchema.safeParse(
      priceFeedObject.json
    );
    if (!success) {
      throw logError(
        ctx.logger,
        `Failed to parse price feed object ${priceFeedObject.objectId}: ${JSON.stringify(
          priceFeedObject.json
        )}`
      );
    }

    const { price_feed } = data.price_info;
    priceByFeedObject.set(
      priceFeedObject.objectId,
      calculatePrice(price_feed.price).toNumber()
    );
  }

  // Fan the unique feed-object prices back out to every requested coin.
  const prices: Record<string, number> = {};
  for (const [coinName, feedObject] of feedObjectByCoin) {
    const price = priceByFeedObject.get(feedObject);
    if (price === undefined) {
      throw logError(
        ctx.logger,
        `Price feed object not found for ${coinName} at ${feedObject} on chain`
      );
    }
    prices[coinName] = price;
  }
  return prices;
};
