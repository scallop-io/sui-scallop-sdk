import { SuiClientTypes } from '@mysten/sui/client';
import { SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import { BigNumber } from 'bignumber.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import {
  ScallopIndexerError,
  ScallopParseError,
  ScallopRpcError,
} from 'src/errors/index.js';
import type { SuiObjectData } from 'src/types/index.js';
import { partitionArray } from 'src/utils/array.js';
import { MarketCollateral, MarketPool } from '../market/types.js';
import { logError, type GrpcReadContext } from '../utils.js';
import {
  IndexerApiResponse,
  IndexerApiResponseType,
  PriceFeedObjectSchema,
} from './schema.js';
import {
  PriceApiContext,
  PriceIndexerContext,
  PriceOnChainContext,
} from './types.js';
import { calculatePrice } from './utils.js';

export const getPythPricesFromPythApi = async (
  ctx: PriceApiContext,
  coinNames: string[]
) => {
  const {
    logger,
    fetchWithCache,
    metadata: { addresses },
    pythPriceServiceConfig: { endpoint, config },
    priceTimeout,
  } = ctx;

  // Fetch the FULL universe of configured feeds — not just the requested
  // coins' feeds — so every single/subset read shares one cache entry keyed on
  // the same stable feed set. This is what collapses the duplicate-request
  // spam: a `getPythCoinPrice('sui')` and a full `getPythCoinPrices()` resolve
  // from the same cached fetch within `priceTimeout`.
  const allFeedIds = Array.from(
    new Set(
      Object.values(addresses.coins)
        .map((coin) => coin?.oracle?.pyth?.feed)
        .filter((feed): feed is string => !!feed)
    )
  ).sort();

  // Feed the network fetch through the cache: the HTTP call now lives INSIDE
  // `queryFn`, so TanStack Query provides in-flight dedup + `priceTimeout` TTL.
  // Returns a stable `feedId -> price` map covering the whole universe.
  const priceByFeedId = await fetchWithCache<Record<string, number>>({
    queryKey: queryKeys.oracle.getPythAllPriceFeeds(endpoint, allFeedIds),
    // staleTime: within this window, reads are served from cache (no refetch).
    // gcTime must be >= staleTime so the entry isn't collected while still fresh.
    staleTime: priceTimeout,
    gcTime: priceTimeout,
    queryFn: async () => {
      const client = new SuiPriceServiceConnection(endpoint, config);
      // NOTE: if the feed universe ever grows past Hermes' per-request limit,
      // chunk `allFeedIds` here and merge the resulting maps.
      const { parsed: feeds } = await client.getLatestPriceUpdates(allFeedIds, {
        parsed: true,
        ignoreInvalidPriceIds: true,
      });

      if (!feeds) {
        throw logError(
          logger,
          new ScallopIndexerError('Failed to fetch price feeds from Pyth API', {
            context: { endpoint, priceFeedIds: allFeedIds },
          })
        );
      }

      const prices: Record<string, number> = {};
      for (const feed of feeds) {
        prices[feed.id] = BigNumber(feed.price.price)
          .shiftedBy(feed.price.expo)
          .toNumber();
      }
      return prices;
    },
  });

  // Fan the cached full-universe prices back out to the requested coins. A coin
  // with no configured feed, or a feed the API didn't return, defaults to 0
  // rather than throwing.
  const prices: Record<string, number> = {};
  for (const coinName of coinNames) {
    const feedId = addresses.coins[coinName]?.oracle?.pyth?.feed;
    prices[coinName] =
      (feedId !== undefined ? priceByFeedId[feedId] : undefined) ?? 0;
  }
  return prices;
};

export const getPythPricesFromIndexerApi = async (
  ctx: PriceApiContext,
  coinNames: string[]
) => {
  const {
    logger,
    indexer,
    fetchWithCache,
    priceTimeout,
    metadata: { addresses },
  } = ctx;

  const allFeedIds = Array.from(
    new Set(
      Object.values(addresses.coins)
        .map((coin) => coin?.oracle?.pyth?.feed)
        .filter((feed): feed is string => !!feed)
    )
  ).sort();

  // Fetch prices from indexer (keyed by coinType, covering the full universe)
  const path = '/api/price/pyth';
  try {
    const { prices: priceByCoinType } =
      await fetchWithCache<IndexerApiResponseType>({
        queryKey: queryKeys.oracle.getPythAllPriceFeeds(
          indexer.url,
          allFeedIds
        ),
        // staleTime: within this window, reads are served from cache (no refetch).
        // gcTime must be >= staleTime so the entry isn't collected while still fresh.
        staleTime: priceTimeout,
        gcTime: priceTimeout,
        queryFn: async () => IndexerApiResponse.parse(await indexer.get(path)),
      });

    // Map the prices to the requested coin names, defaulting to 0 if the coin
    // has no pool coinType or the indexer didn't return a feed for it.
    return coinNames.reduce<Record<string, number>>((acc, coinName) => {
      const coinType = addresses.coins[coinName]?.coinType;
      const feed = coinType ? priceByCoinType[coinType] : undefined;
      acc[coinName] = feed
        ? BigNumber(feed.price).shiftedBy(feed.expo).toNumber()
        : 0;
      return acc;
    }, {});
  } catch (e) {
    throw logError(
      logger,
      new ScallopIndexerError(
        'Failed to fetch price feeds from Scallop Indexer',
        {
          context: {
            endpoint: `${indexer.url}${path}`,
            coinNames,
            message: (e as Error).message,
          },
        }
      )
    );
  }
};

/**
 * Fetch a single raw Pyth price-feed object by id (cached). Returns `null` when
 * the object is absent. Parsing is left to the caller — this is the raw-object
 * read the legacy `ScallopUtils.getPythPrice` did via `queryGetObject`.
 */
export const getPythFeedObjectFromOnChain = async (
  ctx: GrpcReadContext,
  feedObjectId: string
): Promise<SuiObjectData | null> => {
  const { grpc, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: feedObjectId,
    include: { json: true },
  };
  const { object } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({ ...options, node: grpc.url }),
    queryFn: () => grpc.getObject(options),
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
  ctx: GrpcReadContext,
  feedObjectIds: string[]
): Promise<SuiObjectData[]> => {
  if (feedObjectIds.length === 0) return [];
  const { grpc, fetchWithCache } = ctx;
  const options: SuiClientTypes.GetObjectsOptions<{ json: true }> = {
    objectIds: feedObjectIds,
    include: { json: true },
  };
  const { objects } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObjects({ ...options, node: grpc.url }),
    queryFn: () => grpc.client.getObjects(options),
  });
  return objects.filter((o): o is SuiObjectData => !(o instanceof Error));
};

export const getPythPricesFromOnChain = async (
  ctx: PriceOnChainContext,
  coinNames: string[]
) => {
  const {
    grpc,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;

  // Multiple coins can share the same feed object — dedupe before fetching.
  // A coin without a configured pyth feed object maps to an empty/undefined
  // value and defaults to 0 (filtered out of the fetch below).
  const feedObjectByCoin = new Map<string, string | undefined>(
    coinNames.map((coinName) => [
      coinName,
      addresses.coins[coinName]?.oracle?.pyth?.feedObject,
    ])
  );
  const feedObjectIds = Array.from(new Set(feedObjectByCoin.values())).filter(
    (feedObject): feedObject is string => !!feedObject
  );

  // Parse each unique feed object once, keyed by its object id. getObjects
  // supports at most 50 ids per call — batch in chunks of 50.
  const priceByFeedObject = new Map<string, number>();
  for (const batch of partitionArray(feedObjectIds, 50)) {
    const fetchOptions: SuiClientTypes.GetObjectsOptions<{ json: true }> = {
      objectIds: batch,
      include: {
        json: true,
      },
    };

    const { objects: priceFeedObjects } = await fetchWithCache({
      queryKey: queryKeys.rpc.getObjects({
        ...fetchOptions,
        node: grpc.url,
      }),
      queryFn: () => grpc.client.getObjects(fetchOptions),
    });

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
  }

  // Fan the unique feed-object prices back out to every requested coin.
  // A coin with no feed object, or one missing on chain, defaults to 0.
  const prices: Record<string, number> = {};
  for (const [coinName, feedObject] of feedObjectByCoin) {
    prices[coinName] =
      (feedObject !== undefined
        ? priceByFeedObject.get(feedObject)
        : undefined) ?? 0;
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
