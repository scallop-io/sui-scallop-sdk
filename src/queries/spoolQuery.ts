import { normalizeStructTag } from '@mysten/sui/utils';
import {
  parseOriginSpoolData,
  calculateSpoolData,
  parseOriginSpoolRewardPoolData,
  calculateSpoolRewardPoolData,
  parseObjectAs,
} from '../utils';
import type { SuiObjectData, SuiObjectResponse } from '@mysten/sui/client';
import type { ScallopQuery, ScallopUtils } from '../models';
import type {
  Spools,
  Spool,
  StakePool,
  StakeRewardPool,
  StakeAccounts,
  CoinPrices,
  MarketPools,
  OriginSpoolRewardPoolData,
  SpoolData,
  OriginSpoolData,
} from '../types';
import { queryMultipleObjects } from './objectsQuery';

const queryRequiredSpoolObjects = async (
  query: ScallopQuery,
  stakePoolCoinNames: string[]
) => {
  // Phase 1: Single-pass data preparation
  type KeyType = {
    spool?: string;
    spoolReward?: string;
    sCoinTreasury?: string;
  };

  const keyCollections: Record<keyof KeyType, string[]> = {
    spool: [],
    spoolReward: [],
    sCoinTreasury: [],
  };

  const taskMap = new Map<string, KeyType>();

  // Single iteration to collect all keys
  for (const poolCoinName of stakePoolCoinNames) {
    const poolData = query.constants.poolAddresses[poolCoinName];
    const task: KeyType = {
      spool: poolData?.spool,
      spoolReward: poolData?.spoolReward,
      sCoinTreasury: poolData?.sCoinTreasury,
    };

    // Add to key collections
    (Object.entries(task) as [keyof KeyType, string | undefined][]).forEach(
      ([key, value]) => {
        if (value) keyCollections[key].push(value);
      }
    );

    taskMap.set(poolCoinName, task);
  }

  // Phase 2: Parallel queries with pre-collected keys
  const [spoolObjects, spoolRewardObjects, sCoinTreasuryObjects] =
    await Promise.all([
      queryMultipleObjects(query.cache, keyCollections.spool),
      queryMultipleObjects(query.cache, keyCollections.spoolReward),
      queryMultipleObjects(query.cache, keyCollections.sCoinTreasury),
    ]);

  // Phase 3: Create lookup maps
  const createObjectMap = (objects: SuiObjectData[]) =>
    new Map(objects.map((obj) => [obj.objectId, obj]));

  const objectMaps = {
    spool: createObjectMap(spoolObjects),
    spoolReward: createObjectMap(spoolRewardObjects),
    sCoinTreasury: createObjectMap(sCoinTreasuryObjects),
  };

  // Phase 4: Build result in single pass
  const result: Record<string, any> = {};
  for (const [poolCoinName, task] of taskMap) {
    result[poolCoinName] = {
      spool: task.spool ? objectMaps.spool.get(task.spool) : undefined,
      spoolReward: task.spoolReward
        ? objectMaps.spoolReward.get(task.spoolReward)
        : undefined,
      sCoinTreasury: task.sCoinTreasury
        ? objectMaps.sCoinTreasury.get(task.sCoinTreasury)
        : undefined,
    };
  }

  return result as Record<
    string,
    {
      spool?: SuiObjectData;
      spoolReward?: SuiObjectData;
      sCoinTreasury?: SuiObjectData;
    }
  >;
};

const parseSpoolObjects = ({
  spool,
  spoolReward,
}: {
  spool?: SuiObjectData;
  spoolReward?: SuiObjectData;
}): OriginSpoolData & OriginSpoolRewardPoolData => {
  if (!spool || !spoolReward) {
    throw new Error('spool or spoolReward is undefined');
  }
  const _spool = parseObjectAs<SpoolData>(spool);
  const _spoolReward = parseObjectAs<OriginSpoolRewardPoolData>(spoolReward);
  return {
    stakeType: _spool.stake_type,
    maxDistributedPoint: _spool.max_distributed_point,
    distributedPoint: _spool.distributed_point,
    distributedPointPerPeriod: _spool.distributed_point_per_period,
    pointDistributionTime: _spool.point_distribution_time,
    maxStake: _spool.max_stakes,
    stakes: _spool.stakes,
    index: _spool.index,
    createdAt: _spool.created_at,
    lastUpdate: _spool.last_update,
    ..._spoolReward,
  };
};

/**
 * Get spools data.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinNames - Specific an array of support stake market coin name.
 * @param indexer - Whether to use indexer.
 * @return Spools data.
 */
export const getSpools = async (
  query: ScallopQuery,
  stakeMarketCoinNames: string[] = [...query.constants.whitelist.spool],
  indexer: boolean = false,
  marketPools?: MarketPools,
  coinPrices?: CoinPrices
) => {
  const stakeCoinNames = stakeMarketCoinNames.map((stakeMarketCoinName) =>
    query.utils.parseCoinName(stakeMarketCoinName)
  );
  marketPools =
    marketPools ??
    (await query.getMarketPools(stakeCoinNames, { indexer })).pools;

  coinPrices =
    coinPrices ?? (await query.getAllCoinPrices({ marketPools })) ?? {};

  if (!marketPools)
    throw new Error(`Fail to fetch marketPools for ${stakeCoinNames}`);

  const spools: Spools = {};

  if (indexer) {
    const spoolsIndexer = await query.indexer.getSpools();
    const updateSpools = (spool: Spool) => {
      if (!stakeMarketCoinNames.includes(spool.marketCoinName)) return;
      const coinName = query.utils.parseCoinName(spool.marketCoinName);
      const rewardCoinName = query.utils.getSpoolRewardCoinName();
      spool.coinPrice = coinPrices[coinName] ?? spool.coinPrice;
      spool.marketCoinPrice =
        coinPrices[spool.marketCoinName] ?? spool.marketCoinPrice;
      spool.rewardCoinPrice =
        coinPrices[rewardCoinName] ?? spool.rewardCoinPrice;
      spools[spool.marketCoinName] = spool;
    };
    Object.values(spoolsIndexer)
      .filter((t) => !!t)
      .forEach(updateSpools);

    return spools;
  }

  const requiredObjects = await queryRequiredSpoolObjects(
    query,
    stakeCoinNames
  );

  await Promise.allSettled(
    stakeMarketCoinNames.map(async (stakeMarketCoinName, idx) => {
      try {
        const stakeCoinName = stakeCoinNames[idx];
        const spool = await getSpool(
          query,
          stakeMarketCoinName,
          indexer,
          coinPrices,
          requiredObjects[stakeCoinName]
        );

        if (spool) {
          spools[stakeMarketCoinName] = spool;
        }
      } catch (e) {
        console.error(e);
      }
    })
  );

  return spools;
};

/**
 * Get spool data.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinName - Specific support stake market coin name.
 * @param indexer - Whether to use indexer.
 * @param marketPool - The market pool data.
 * @param coinPrices - The coin prices.
 * @return Spool data.
 */
export const getSpool = async (
  query: ScallopQuery,
  marketCoinName: string,
  indexer: boolean = false,
  coinPrices?: CoinPrices,
  requiredObjects?: {
    spool?: SuiObjectData;
    spoolReward?: SuiObjectData;
  }
) => {
  const coinName = query.utils.parseCoinName<string>(marketCoinName);
  coinPrices = coinPrices || (await query.getAllCoinPrices());

  if (indexer) {
    const spoolIndexer = await query.indexer.getSpool(marketCoinName);
    const coinName = query.utils.parseCoinName<string>(marketCoinName);
    const rewardCoinName = query.utils.getSpoolRewardCoinName();
    spoolIndexer.coinPrice = coinPrices?.[coinName] ?? spoolIndexer.coinPrice;
    spoolIndexer.marketCoinPrice =
      coinPrices?.[marketCoinName] ?? spoolIndexer.marketCoinPrice;
    spoolIndexer.rewardCoinPrice =
      coinPrices?.[rewardCoinName] ?? spoolIndexer.rewardCoinPrice;

    return spoolIndexer;
  }

  requiredObjects ??= (await queryRequiredSpoolObjects(query, [coinName]))[
    coinName
  ];

  const rewardCoinName = query.utils.getSpoolRewardCoinName();
  coinPrices = coinPrices || (await query.utils.getCoinPrices());

  const parsedSpoolObjects = parseSpoolObjects(requiredObjects);
  const parsedSpoolData = parseOriginSpoolData(parsedSpoolObjects);

  const marketCoinPrice = coinPrices?.[marketCoinName] ?? 0;
  const marketCoinDecimal = query.utils.getCoinDecimal(marketCoinName);
  const calculatedSpoolData = calculateSpoolData(
    parsedSpoolData,
    marketCoinPrice,
    marketCoinDecimal
  );

  const parsedSpoolRewardPoolData =
    parseOriginSpoolRewardPoolData(parsedSpoolObjects);

  const rewardCoinPrice = coinPrices?.[rewardCoinName] ?? 0;
  const rewardCoinDecimal = query.utils.getCoinDecimal(rewardCoinName);

  const calculatedRewardPoolData = calculateSpoolRewardPoolData(
    parsedSpoolData,
    parsedSpoolRewardPoolData,
    calculatedSpoolData,
    rewardCoinPrice,
    rewardCoinDecimal
  );

  return {
    marketCoinName: marketCoinName,
    symbol: query.utils.parseSymbol(marketCoinName),
    coinType: query.utils.parseCoinType(coinName),
    marketCoinType: query.utils.parseMarketCoinType(coinName),
    rewardCoinType: query.utils.isMarketCoin(rewardCoinName)
      ? query.utils.parseMarketCoinType(rewardCoinName)
      : query.utils.parseCoinType(rewardCoinName),
    sCoinType: query.utils.parseSCoinType(marketCoinName) ?? '',
    coinDecimal: query.utils.getCoinDecimal(coinName),
    rewardCoinDecimal: query.utils.getCoinDecimal(rewardCoinName),
    coinPrice: coinPrices?.[coinName] ?? 0,
    marketCoinPrice: marketCoinPrice,
    rewardCoinPrice: rewardCoinPrice,
    maxPoint: parsedSpoolData.maxPoint,
    distributedPoint: parsedSpoolData.distributedPoint,
    maxStake: parsedSpoolData.maxStake,
    ...calculatedSpoolData,
    exchangeRateNumerator: parsedSpoolRewardPoolData.exchangeRateNumerator,
    exchangeRateDenominator: parsedSpoolRewardPoolData.exchangeRateDenominator,
    ...calculatedRewardPoolData,
  };
};

/**
 * Get all stake accounts of the owner.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - Owner address.
 * @return Stake accounts.
 */
export const getStakeAccounts = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  ownerAddress?: string
) => {
  const owner = ownerAddress || utils.suiKit.currentAddress();
  const spoolObjectId = utils.address.get('spool.object');
  const stakeAccountType = `${spoolObjectId}::spool_account::SpoolAccount`;
  const stakeObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;
  do {
    const paginatedStakeObjectsResponse =
      await utils.cache.queryGetOwnedObjects({
        owner,
        filter: { StructType: stakeAccountType },
        options: {
          showContent: true,
          showType: true,
        },
        cursor: nextCursor,
        limit: 10,
      });
    if (!paginatedStakeObjectsResponse) continue;

    stakeObjectsResponse.push(...paginatedStakeObjectsResponse.data);
    if (
      paginatedStakeObjectsResponse.hasNextPage &&
      paginatedStakeObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedStakeObjectsResponse.nextCursor;
    } else {
      hasNextPage = false;
    }
  } while (hasNextPage);

  const stakeAccounts: StakeAccounts = [
    ...utils.constants.whitelist.spool,
  ].reduce((acc, stakeName) => {
    acc[stakeName] = [];
    return acc;
  }, {} as StakeAccounts);

  const stakeMarketCoinTypes: Record<string, string> = Object.keys(
    stakeAccounts
  ).reduce(
    (types, stakeMarketCoinName) => {
      const stakeCoinName = utils.parseCoinName<string>(stakeMarketCoinName);
      const marketCoinType = utils.parseMarketCoinType(stakeCoinName);

      types[stakeMarketCoinName as string] =
        `${spoolObjectId}::spool_account::SpoolAccount<${marketCoinType}>`;
      return types;
    },
    {} as Record<string, string>
  );

  // Reverse the mapping
  const reversedStakeMarketCoinTypes: Record<string, string> = Object.entries(
    stakeMarketCoinTypes
  ).reduce(
    (reversedTypes, [key, value]) => {
      reversedTypes[value] = key as string;
      return reversedTypes;
    },
    {} as Record<string, string>
  );

  for (const stakeObject of stakeObjectsResponse.map((ref) => ref.data)) {
    const id = stakeObject?.objectId;
    const type = stakeObject?.type!;
    if (id && stakeObject?.content && 'fields' in stakeObject.content) {
      const fields = stakeObject.content.fields as any;
      const stakePoolId = String(fields.spool_id);
      const stakeType = String(fields.stake_type.fields.name);
      const staked = Number(fields.stakes);
      const index = Number(fields.index);
      const points = Number(fields.points);
      const totalPoints = Number(fields.total_points);

      const stakeMarketCoinTypeMap: Record<string, StakeAccounts[string]> = {
        sweth: stakeAccounts.sweth,
        ssui: stakeAccounts.ssui,
        swusdc: stakeAccounts.swusdc,
        swusdt: stakeAccounts.swusdt,
        scetus: stakeAccounts.scetus,
        safsui: stakeAccounts.safsui,
        shasui: stakeAccounts.shasui,
        svsui: stakeAccounts.svsui,
        susdc: stakeAccounts.susdc,
      };

      const normalizedType = normalizeStructTag(type);
      const stakeAccountArray =
        stakeMarketCoinTypeMap[reversedStakeMarketCoinTypes[normalizedType]];

      if (stakeAccountArray) {
        stakeAccountArray.push({
          id,
          type: normalizedType,
          stakePoolId,
          stakeType: normalizeStructTag(stakeType),
          staked,
          index,
          points,
          totalPoints,
        });
      }
    }
  }
  return stakeAccounts;
};

/**
 * Get stake pool data.
 *
 * @description
 * For backward compatible, it is recommended to use `getSpool` method
 * to get stake pool info in spool data.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinName - Specific support stake market coin name.
 * @return Stake pool data.
 */
export const getStakePool = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  marketCoinName: string
) => {
  const poolId = utils.address.get(`spool.pools.${marketCoinName}.id`);
  let stakePool: StakePool | undefined = undefined;
  const stakePoolObjectResponse = await utils.cache.queryGetObject(poolId);
  if (stakePoolObjectResponse?.data) {
    const stakePoolObject = stakePoolObjectResponse.data;
    const id = stakePoolObject.objectId;
    const type = stakePoolObject.type!;
    if (stakePoolObject.content && 'fields' in stakePoolObject.content) {
      const fields = stakePoolObject.content.fields as any;
      const maxPoint = Number(fields.max_distributed_point);
      const distributedPoint = Number(fields.distributed_point);
      const pointPerPeriod = Number(fields.distributed_point_per_period);
      const period = Number(fields.point_distribution_time);
      const maxStake = Number(fields.max_stakes);
      const stakeType = String(fields.stake_type.fields.name);
      const totalStaked = Number(fields.stakes);
      const index = Number(fields.index);
      const createdAt = Number(fields.created_at);
      const lastUpdate = Number(fields.last_update);
      stakePool = {
        id,
        type: normalizeStructTag(type),
        maxPoint,
        distributedPoint,
        pointPerPeriod,
        period,
        maxStake,
        stakeType: normalizeStructTag(stakeType),
        totalStaked,
        index,
        createdAt,
        lastUpdate,
      };
    }
  }
  return stakePool;
};

/**
 * Get stake reward pool of the owner.
 *
 * @description
 * For backward compatible, it is recommended to use `getSpool` method
 * to get reward info in spool data.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinName - Specific support stake market coin name.
 * @return Stake reward pool.
 */
export const getStakeRewardPool = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  marketCoinName: string
) => {
  const poolId = utils.address.get(
    `spool.pools.${marketCoinName}.rewardPoolId`
  );
  let stakeRewardPool: StakeRewardPool | undefined = undefined;
  const stakeRewardPoolObjectResponse =
    await utils.cache.queryGetObject(poolId);

  if (stakeRewardPoolObjectResponse?.data) {
    const stakeRewardPoolObject = stakeRewardPoolObjectResponse.data;
    const id = stakeRewardPoolObject.objectId;
    const type = stakeRewardPoolObject.type!;
    if (
      stakeRewardPoolObject.content &&
      'fields' in stakeRewardPoolObject.content
    ) {
      const rewardPoolFields = stakeRewardPoolObject.content.fields as any;
      const stakePoolId = String(rewardPoolFields.spool_id);
      const ratioNumerator = Number(rewardPoolFields.exchange_rate_numerator);
      const ratioDenominator = Number(
        rewardPoolFields.exchange_rate_denominator
      );
      const rewards = Number(rewardPoolFields.rewards);
      const claimedRewards = Number(rewardPoolFields.claimed_rewards);

      stakeRewardPool = {
        id,
        type: normalizeStructTag(type),
        stakePoolId,
        ratioNumerator,
        ratioDenominator,
        rewards,
        claimedRewards,
      };
    }
  }
  return stakeRewardPool;
};
