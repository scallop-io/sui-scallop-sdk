import { normalizeStructTag } from '@mysten/sui/utils';
import { queryKeys } from 'src/constants/queryKeys.js';
import { mapSpoolData } from './utils.js';
import type { SuiObjectData } from 'src/types/index.js';
import type { CoinPrices } from 'src/types/utils.js';
import { parseObjectAs } from 'src/utils/object.js';
import { partitionArray } from 'src/utils/array.js';
import type {
  RequiredSpoolObjects,
  Spool,
  SpoolIndexerContext,
  SpoolOnChainContext,
  SpoolReadArgs,
  Spools,
  StakeAccounts,
  StakePool,
  StakeRewardPool,
} from './types.js';
import type { OnChainReadContext } from '../utils.js';
import {
  calculateSpoolData,
  calculateSpoolRewardPoolData,
  parseOriginSpoolData,
  parseOriginSpoolRewardPoolData,
  parseSpoolObjects,
} from './utils.js';
import type { SuiClientTypes } from '@mysten/sui/client';

export const getSpoolsFromIndexer = async (
  ctx: SpoolIndexerContext,
  { coinPrices, stakeCoinNames }: SpoolReadArgs = {}
): Promise<Spools> => {
  const { indexer, fetchWithCache, metadata } = ctx;
  coinPrices ??= {};

  const { spools: rawSpools } = await fetchWithCache<{ spools: Spool[] }>({
    queryKey: queryKeys.api.getSpools(),
    queryFn: () => indexer.get<{ spools: Spool[] }>('/api/spools/migrate'),
  });

  const allowedNames = stakeCoinNames
    ? new Set(stakeCoinNames)
    : metadata.whitelist.spool;

  const rewardCoinName = metadata.getSpoolRewardCoinName();

  return rawSpools.reduce<Spools>((spools, spool) => {
    if (!allowedNames.has(spool.marketCoinName)) return spools;

    const coinName = metadata.parseCoinName(spool.marketCoinName);

    spools[spool.marketCoinName] = {
      ...spool,
      coinPrice: coinPrices[coinName] ?? spool.coinPrice,
      marketCoinPrice:
        coinPrices[spool.marketCoinName] ?? spool.marketCoinPrice,
      rewardCoinPrice: coinPrices[rewardCoinName] ?? spool.rewardCoinPrice,
    };

    return spools;
  }, {});
};

export const getSpoolFromIndexer = async (
  ctx: SpoolIndexerContext,
  {
    coinPrices,
    stakeCoinName,
  }: {
    coinPrices: CoinPrices;
    stakeCoinName: string;
  }
): Promise<Spool | null> => {
  const spools = await getSpoolsFromIndexer(ctx, {
    coinPrices,
    stakeCoinNames: [stakeCoinName],
  });

  return spools[stakeCoinName] ?? null;
};

export const getSpoolsFromOnChain = async (
  ctx: SpoolOnChainContext,
  { coinPrices = {}, stakeCoinNames }: SpoolReadArgs = {}
): Promise<Spools> => {
  const { metadata } = ctx;
  const marketCoinNames = stakeCoinNames ?? [
    ...metadata.whitelist.spool.values(),
  ];
  const coinNames = marketCoinNames.map((marketCoinName) =>
    metadata.parseCoinName(marketCoinName)
  );
  const requiredObjects = await queryRequiredSpoolObjects(ctx, coinNames);

  const results = await Promise.allSettled(
    marketCoinNames.map((marketCoinName, index) =>
      getSpoolFromOnChain(ctx, {
        coinPrices,
        stakeCoinName: marketCoinName,
        requiredObjects: requiredObjects[coinNames[index]],
      })
    )
  );

  return results.reduce<Spools>((spools, result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      spools[marketCoinNames[index]] = result.value;
    }
    return spools;
  }, {});
};

export const getSpoolFromOnChain = async (
  ctx: SpoolOnChainContext,
  {
    coinPrices,
    stakeCoinName,
    requiredObjects,
  }: {
    coinPrices: CoinPrices;
    stakeCoinName: string;
    requiredObjects?: RequiredSpoolObjects[string];
  }
): Promise<Spool> => {
  const { metadata } = ctx;
  const coinName = metadata.parseCoinName(stakeCoinName);
  const rewardCoinName = metadata.getSpoolRewardCoinName();
  const parsedSpoolObjects = mapSpoolData(
    parseSpoolObjects(
      requiredObjects ??
        (await queryRequiredSpoolObjects(ctx, [coinName]))[coinName]
    )
  );
  const parsedSpoolData = parseOriginSpoolData(parsedSpoolObjects);

  const marketCoinPrice = coinPrices[stakeCoinName] ?? 0;
  const calculatedSpoolData = calculateSpoolData(
    parsedSpoolData,
    marketCoinPrice,
    metadata.getCoinDecimal(stakeCoinName)
  );

  const parsedSpoolRewardPoolData =
    parseOriginSpoolRewardPoolData(parsedSpoolObjects);
  const rewardCoinPrice = coinPrices[rewardCoinName] ?? 0;

  return {
    marketCoinName: stakeCoinName,
    symbol: metadata.parseSymbol(stakeCoinName),
    coinType: metadata.parseCoinType(coinName),
    marketCoinType: metadata.parseMarketCoinType(coinName),
    rewardCoinType: metadata.isMarketCoin(rewardCoinName)
      ? metadata.parseMarketCoinType(rewardCoinName)
      : metadata.parseCoinType(rewardCoinName),
    sCoinType: metadata.parseSCoinType(stakeCoinName) ?? '',
    coinDecimal: metadata.getCoinDecimal(coinName),
    rewardCoinDecimal: metadata.getCoinDecimal(rewardCoinName),
    coinPrice: coinPrices[coinName] ?? 0,
    marketCoinPrice,
    rewardCoinPrice,
    maxPoint: parsedSpoolData.maxPoint,
    distributedPoint: parsedSpoolData.distributedPoint,
    maxStake: parsedSpoolData.maxStake,
    ...calculatedSpoolData,
    exchangeRateNumerator: parsedSpoolRewardPoolData.exchangeRateNumerator,
    exchangeRateDenominator: parsedSpoolRewardPoolData.exchangeRateDenominator,
    ...calculateSpoolRewardPoolData(
      parsedSpoolData,
      parsedSpoolRewardPoolData,
      calculatedSpoolData,
      rewardCoinPrice,
      metadata.getCoinDecimal(rewardCoinName)
    ),
  };
};

export const getStakeAccountsFromOnChain = async (
  ctx: SpoolOnChainContext,
  {
    address,
    stakeCoinNames,
  }: {
    address: string;
    stakeCoinNames?: readonly string[];
  }
): Promise<StakeAccounts> => {
  const { metadata } = ctx;
  const stakeAccountType = `${metadata.addresses.spoolObjectId}::spool_account::SpoolAccount`;

  const stakeAccountObjects = await queryStakeAccounts(ctx, {
    address,
    stakeAccountType,
  });

  const stakeAccounts = (
    stakeCoinNames ?? [...metadata.whitelist.spool.values()]
  ).reduce<StakeAccounts>((accounts, stakeName) => {
    accounts[stakeName] = [];
    return accounts;
  }, {});

  const stakeMarketCoinTypes = Object.keys(stakeAccounts).reduce<
    Record<string, string>
  >((types, stakeCoinName) => {
    const coinName = metadata.parseCoinName(stakeCoinName);
    const marketCoinType = metadata.parseMarketCoinType(coinName);
    types[stakeCoinName] =
      `${metadata.addresses.spoolObjectId}::spool_account::SpoolAccount<${marketCoinType}>`;
    return types;
  }, {});

  const stakeNameByType = Object.entries(stakeMarketCoinTypes).reduce<
    Record<string, string>
  >((types, [stakeCoinName, stakeType]) => {
    types[stakeType] = stakeCoinName;
    return types;
  }, {});

  for (const stakeObject of stakeAccountObjects) {
    const { objectId: id, type, json } = stakeObject;
    if (!id || !type || !json) continue;

    const fields = parseObjectAs<{
      spool_id: string;
      stake_type: string;
      stakes: string;
      index: string;
      points: string;
      total_points: string;
    }>(stakeObject);
    const normalizedType = normalizeStructTag(type);
    const stakeCoinName = stakeNameByType[normalizedType];
    const stakeAccountArray = stakeAccounts[stakeCoinName];
    if (!stakeAccountArray) continue;

    stakeAccountArray.push({
      id,
      type: normalizedType,
      stakePoolId: String(fields.spool_id),
      stakeType: normalizeStructTag(String(fields.stake_type)),
      staked: Number(fields.stakes),
      index: Number(fields.index),
      points: Number(fields.points),
      totalPoints: Number(fields.total_points),
    });
  }

  return stakeAccounts;
};

export const getSpoolRewardPoolsFromOnChain = async (
  ctx: SpoolOnChainContext,
  {
    stakeCoinNames,
  }: {
    stakeCoinNames: string[];
  }
) => {
  const stakeRewardPools = await Promise.allSettled(
    stakeCoinNames.map((stakeCoinName) =>
      queryStakeRewardPool(ctx, { stakeCoinName })
    )
  );

  return stakeRewardPools.reduce<Record<string, StakeRewardPool | undefined>>(
    (pools, result, index) => {
      if (result.status === 'fulfilled') {
        pools[stakeCoinNames[index]] = result.value;
      }
      return pools;
    },
    {}
  );
};

const queryStakeAccounts = async (
  ctx: OnChainReadContext,
  { address, stakeAccountType }: { address: string; stakeAccountType: string }
) => {
  const { onchain, fetchWithCache } = ctx;

  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;

  const stakeObjectsResponse: SuiObjectData[] = [];

  do {
    const input: SuiClientTypes.ListOwnedObjectsOptions = {
      owner: address,
      type: stakeAccountType,
      include: {
        json: true,
      },
      cursor: nextCursor,
      limit: 50,
    };
    const response =
      await fetchWithCache<SuiClientTypes.ListOwnedObjectsResponse>({
        queryKey: queryKeys.rpc.getOwnedObjects(input),
        queryFn: () => onchain.client.listOwnedObjects(input),
      });

    if (response.objects) {
      stakeObjectsResponse.push(...response.objects);
    }

    if (response.hasNextPage && response.cursor) {
      hasNextPage = true;
      nextCursor = response.cursor;
    } else {
      hasNextPage = false;
    }
  } while (hasNextPage);

  return stakeObjectsResponse;
};

const queryRequiredSpoolObjects = async (
  { onchain, metadata, fetchWithCache }: SpoolOnChainContext,
  stakeCoinNames: string[]
): Promise<RequiredSpoolObjects> => {
  const keyTypes = ['spool', 'spoolReward', 'sCoinTreasury'] as const;
  const objectIds = stakeCoinNames.flatMap((coinName) => {
    const poolData = metadata.poolAddresses[coinName];
    return keyTypes.flatMap((keyType) => {
      const objectId = poolData?.[keyType];
      return objectId ? [objectId] : [];
    });
  });

  const objectDatas: SuiObjectData[] = [];
  const batches = partitionArray([...new Set(objectIds)], 50);

  for (const batch of batches) {
    const response = await fetchWithCache({
      queryKey: queryKeys.rpc.getObjects({
        objectIds: batch,
        node: onchain.url,
      }),
      queryFn: () =>
        onchain.client.getObjects({
          objectIds: batch,
          include: { json: true },
        }),
    });

    objectDatas.push(
      ...response.objects.filter(
        (object): object is SuiObjectData => !(object instanceof Error)
      )
    );
  }

  const objectDataMap = objectDatas.reduce(
    (acc, obj) => {
      acc[obj.objectId] = obj;
      return acc;
    },
    {} as Record<string, SuiObjectData>
  );

  return stakeCoinNames.reduce<RequiredSpoolObjects>((objects, coinName) => {
    const poolData = metadata.poolAddresses[coinName];
    objects[coinName] = {
      spool: objectDataMap[poolData?.spool ?? ''],
      spoolReward: objectDataMap[poolData?.spoolReward ?? ''],
    };
    return objects;
  }, {});
};

export const queryStakeRewardPool = async (
  ctx: SpoolOnChainContext,
  {
    stakeCoinName,
  }: {
    stakeCoinName: string;
  }
): Promise<StakeRewardPool | undefined> => {
  const { metadata, onchain, fetchWithCache } = ctx;

  const poolId = metadata.addresses.spools[stakeCoinName]?.rewardPoolId;
  if (!poolId) return undefined;

  const fetchOptions = {
    json: true,
  };
  const stakeRewardPoolObjectResponse = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({
      objectId: poolId,
      node: onchain.url,
      include: fetchOptions,
    }),
    queryFn: () =>
      onchain.getObject({
        objectId: poolId,
        include: fetchOptions,
      }),
  });

  const stakeRewardPoolObject = stakeRewardPoolObjectResponse.object;
  if (!stakeRewardPoolObject?.json) return undefined;

  const rewardPoolFields = parseObjectAs<{
    spool_id: string;
    exchange_rate_numerator: string;
    exchange_rate_denominator: string;
    rewards: string;
    claimed_rewards: string;
  }>(stakeRewardPoolObject);

  return {
    id: stakeRewardPoolObject.objectId,
    type: normalizeStructTag(stakeRewardPoolObject.type ?? ''),
    stakePoolId: String(rewardPoolFields.spool_id),
    ratioNumerator: Number(rewardPoolFields.exchange_rate_numerator),
    ratioDenominator: Number(rewardPoolFields.exchange_rate_denominator),
    rewards: Number(rewardPoolFields.rewards),
    claimedRewards: Number(rewardPoolFields.claimed_rewards),
  };
};

export const getStakePoolFromOnChain = async (
  ctx: SpoolOnChainContext,
  stakeCoinName: string
): Promise<StakePool | undefined> => {
  const { onchain, fetchWithCache, metadata } = ctx;
  const poolId = metadata.addresses.spools[stakeCoinName]?.id;
  if (!poolId) return undefined;

  const include = { json: true };
  const response = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({
      objectId: poolId,
      node: onchain.url,
      include,
    }),
    queryFn: () => onchain.getObject({ objectId: poolId, include }),
  });

  const object = response.object;
  if (!object?.json) return undefined;

  const fields = parseObjectAs<{
    max_distributed_point: string;
    distributed_point: string;
    distributed_point_per_period: string;
    point_distribution_time: string;
    max_stakes: string;
    stake_type: string;
    stakes: string;
    index: string;
    created_at: string;
    last_update: string;
  }>(object);

  return {
    id: object.objectId,
    type: normalizeStructTag(object.type ?? ''),
    maxPoint: Number(fields.max_distributed_point),
    distributedPoint: Number(fields.distributed_point),
    pointPerPeriod: Number(fields.distributed_point_per_period),
    period: Number(fields.point_distribution_time),
    maxStake: Number(fields.max_stakes),
    stakeType: normalizeStructTag(String(fields.stake_type)),
    totalStaked: Number(fields.stakes),
    index: Number(fields.index),
    createdAt: Number(fields.created_at),
    lastUpdate: Number(fields.last_update),
  };
};
