import { normalizeStructTag } from '@mysten/sui/utils';
import { POOL_ADDRESSES, SUPPORT_SPOOLS } from '../constants';
import {
  parseOriginSpoolData,
  calculateSpoolData,
  parseOriginSpoolRewardPoolData,
  calculateSpoolRewardPoolData,
  isMarketCoin,
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
  SupportStakeMarketCoins,
  SupportStakeCoins,
  CoinPrices,
  MarketPools,
  OriginSpoolRewardPoolData,
  SpoolData,
  OriginSpoolData,
} from '../types';
import { queryMultipleObjects } from './objectsQuery';

const queryRequiredSpoolObjects = async (
  query: ScallopQuery,
  stakePoolCoinNames: SupportStakeCoins[]
) => {
  // Prepare all tasks for querying each object type
  const tasks = stakePoolCoinNames.map((t, idx) => ({
    poolCoinName: stakePoolCoinNames[idx],
    spool: POOL_ADDRESSES[t]?.spool,
    spoolReward: POOL_ADDRESSES[t]?.spoolReward,
    sCoinTreasury: POOL_ADDRESSES[t]?.sCoinTreasury,
  }));

  // Query all objects for each key in parallel
  const [spoolObjects, spoolRewardObjects, sCoinTreasuryObjects] =
    await Promise.all([
      queryMultipleObjects(
        query.cache,
        tasks.map((task) => task.spool).filter((t): t is string => !!t)
      ),
      queryMultipleObjects(
        query.cache,
        tasks.map((task) => task.spoolReward).filter((t): t is string => !!t)
      ),
      queryMultipleObjects(
        query.cache,
        tasks.map((task) => task.sCoinTreasury).filter((t): t is string => !!t)
      ),
    ]);

  // Map the results back to poolCoinNames
  const mapObjects = (
    tasks: { poolCoinName: string; [key: string]: string | undefined }[],
    fetchedObjects: SuiObjectData[]
  ) => {
    const resultMap: Record<string, SuiObjectData> = {};
    let fetchedIndex = 0;

    for (const task of tasks) {
      const key = task[Object.keys(task)[1]]; // current object key being queried
      if (key) {
        resultMap[task.poolCoinName] = fetchedObjects[fetchedIndex];
        fetchedIndex++;
      }
    }
    return resultMap;
  };

  const spoolMap = mapObjects(tasks, spoolObjects);
  const spoolRewardMap = mapObjects(tasks, spoolRewardObjects);
  const sCoinTreasuryMap = mapObjects(tasks, sCoinTreasuryObjects);

  // Construct the final requiredObjects result
  return stakePoolCoinNames.reduce(
    (acc, name) => {
      acc[name] = {
        spool: spoolMap[name],
        spoolReward: spoolRewardMap[name],
        sCoinTreasury: sCoinTreasuryMap[name],
      };
      return acc;
    },
    {} as Record<
      SupportStakeCoins,
      {
        spool: SuiObjectData;
        spoolReward: SuiObjectData;
        sCoinTreasury: SuiObjectData;
      }
    >
  );
};

const parseSpoolObjects = ({
  spool,
  spoolReward,
}: {
  spool: SuiObjectData;
  spoolReward: SuiObjectData;
}): OriginSpoolData & OriginSpoolRewardPoolData => {
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
  stakeMarketCoinNames: SupportStakeMarketCoins[] = [...SUPPORT_SPOOLS],
  indexer: boolean = false,
  marketPools?: MarketPools,
  coinPrices?: CoinPrices
) => {
  const stakeCoinNames = stakeMarketCoinNames.map((stakeMarketCoinName) =>
    query.utils.parseCoinName<SupportStakeCoins>(stakeMarketCoinName)
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
      const coinName = query.utils.parseCoinName<SupportStakeCoins>(
        spool.marketCoinName
      );
      const rewardCoinName = query.utils.getSpoolRewardCoinName(
        spool.marketCoinName
      );
      spool.coinPrice = coinPrices[coinName] ?? spool.coinPrice;
      spool.marketCoinPrice =
        coinPrices[spool.marketCoinName] ?? spool.marketCoinPrice;
      spool.rewardCoinPrice =
        coinPrices[rewardCoinName] ?? spool.rewardCoinPrice;
      spools[spool.marketCoinName] = spool;
    };
    Object.values(spoolsIndexer).forEach(updateSpools);

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
  marketCoinName: SupportStakeMarketCoins,
  indexer: boolean = false,
  coinPrices?: CoinPrices,
  requiredObjects?: {
    spool: SuiObjectData;
    spoolReward: SuiObjectData;
  }
) => {
  const coinName = query.utils.parseCoinName<SupportStakeCoins>(marketCoinName);
  coinPrices = coinPrices || (await query.getAllCoinPrices());

  if (indexer) {
    const spoolIndexer = await query.indexer.getSpool(marketCoinName);
    const coinName =
      query.utils.parseCoinName<SupportStakeCoins>(marketCoinName);
    const rewardCoinName = query.utils.getSpoolRewardCoinName(marketCoinName);
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

  const rewardCoinName = query.utils.getSpoolRewardCoinName(marketCoinName);
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
    rewardCoinType: isMarketCoin(rewardCoinName)
      ? query.utils.parseMarketCoinType(rewardCoinName)
      : query.utils.parseCoinType(rewardCoinName),
    sCoinType: query.utils.parseSCoinType(marketCoinName),
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

  const stakeAccounts: StakeAccounts = SUPPORT_SPOOLS.reduce(
    (acc, stakeName) => {
      acc[stakeName] = [];
      return acc;
    },
    {} as StakeAccounts
  );

  const stakeMarketCoinTypes: Record<SupportStakeMarketCoins, string> =
    Object.keys(stakeAccounts).reduce(
      (types, stakeMarketCoinName) => {
        const stakeCoinName =
          utils.parseCoinName<SupportStakeCoins>(stakeMarketCoinName);
        const marketCoinType = utils.parseMarketCoinType(stakeCoinName);

        types[stakeMarketCoinName as SupportStakeMarketCoins] =
          `${spoolObjectId}::spool_account::SpoolAccount<${marketCoinType}>`;
        return types;
      },
      {} as Record<SupportStakeMarketCoins, string>
    );

  // Reverse the mapping
  const reversedStakeMarketCoinTypes: Record<string, SupportStakeMarketCoins> =
    Object.entries(stakeMarketCoinTypes).reduce(
      (reversedTypes, [key, value]) => {
        reversedTypes[value] = key as SupportStakeMarketCoins;
        return reversedTypes;
      },
      {} as Record<string, SupportStakeMarketCoins>
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

      const stakeMarketCoinTypeMap: Record<
        SupportStakeMarketCoins,
        StakeAccounts[SupportStakeMarketCoins]
      > = {
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
  marketCoinName: SupportStakeMarketCoins
) => {
  const poolId = utils.address.get(`spool.pools.${marketCoinName}.id`);
  let stakePool: StakePool | undefined = undefined;
  const stakePoolObjectResponse = await utils.cache.queryGetObject(poolId, {
    showContent: true,
    showType: true,
  });
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
  marketCoinName: SupportStakeMarketCoins
) => {
  const poolId = utils.address.get(
    `spool.pools.${marketCoinName}.rewardPoolId`
  );
  let stakeRewardPool: StakeRewardPool | undefined = undefined;
  const stakeRewardPoolObjectResponse = await utils.cache.queryGetObject(
    poolId,
    {
      showContent: true,
      showType: true,
    }
  );

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
