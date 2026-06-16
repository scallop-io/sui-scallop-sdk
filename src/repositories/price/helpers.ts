import { SuiClientTypes } from '@mysten/sui/client';
import {
  PriceApiContext,
  PriceIndexerContext,
  PriceOnChainContext,
} from './types.js';
import type { BaseContext } from '../types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { PriceFeedObjectSchema } from './schema.js';
import { calculatePrice } from './utils.js';
import { logError } from '../utils.js';
import {
  ScallopIndexerError,
  ScallopParseError,
  ScallopRpcError,
} from 'src/errors/index.js';
import { SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import type { SuiObjectData } from 'src/types/index.js';
import { MarketCollateral, MarketPool } from '../market/types.js';

export const getPythPricesFromApi = async (
  ctx: PriceApiContext,
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
      new ScallopIndexerError('Failed to fetch price feeds from Pyth API', {
        context: { endpoint, priceFeedIds },
      })
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
            new ScallopIndexerError('Price feed not found from Pyth API', {
              context: { coinName, feedId },
            })
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
  ctx: PriceOnChainContext,
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
      throw logError(
        ctx.logger,
        new ScallopRpcError('Failed to fetch price feed object on chain', {
          cause: priceFeedObject,
        })
      );
    }

    const { data, success } = PriceFeedObjectSchema.safeParse(
      priceFeedObject.json
    );
    if (!success) {
      throw logError(
        ctx.logger,
        new ScallopParseError('Failed to parse price feed object', {
          context: {
            objectId: priceFeedObject.objectId,
            json: JSON.stringify(priceFeedObject.json),
          },
        })
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
        new ScallopRpcError('Price feed object not found on chain', {
          context: { coinName, feedObject },
        })
      );
    }
    prices[coinName] = price;
  }
  return prices;
};

export const getPricesFromIndexer = async (
  ctx: PriceIndexerContext,
  {
    coinNames,
  }: {
    coinNames: string[];
  }
) => {
  const { indexer, fetchWithCache } = ctx;
  const path = '/api/market/migrate';

  const resp = await fetchWithCache<{
    pools: MarketPool[];
    collaterals: MarketCollateral[];
  }>({
    queryKey: queryKeys.api.getMarkets(),
    queryFn: () => indexer.get(path),
  });

  return resp.pools.reduce(
    (acc, pool) => {
      if (coinNames.includes(pool.coinName)) {
        acc[pool.coinName] = pool.coinPrice;
      }
      return acc;
    },
    {} as Record<string, number>
  );
};
