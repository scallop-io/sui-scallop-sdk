import { normalizeStructTag } from '@mysten/sui.js/utils';
import { SUPPORT_SPOOLS } from '../constants';
import {
  parseOriginSpoolData,
  calculateSpoolData,
  parseOriginSpoolRewardPoolData,
  calculateSpoolRewardPoolData,
  isMarketCoin,
} from '../utils';
import type { SuiObjectResponse } from '@mysten/sui.js/client';
import type { ScallopQuery } from '../models';
import type {
  MarketPool,
  Spools,
  Spool,
  StakePool,
  StakeRewardPool,
  StakeAccounts,
  SupportStakeMarketCoins,
  SupportStakeCoins,
  CoinPrices,
} from '../types';

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
  stakeMarketCoinNames?: SupportStakeMarketCoins[],
  indexer: boolean = false
) => {
  stakeMarketCoinNames = stakeMarketCoinNames || [...SUPPORT_SPOOLS];
  const stakeCoinNames = stakeMarketCoinNames.map((stakeMarketCoinName) =>
    query.utils.parseCoinName<SupportStakeCoins>(stakeMarketCoinName)
  );
  const rewardCoinNames = stakeMarketCoinNames.map((stakeMarketCoinName) => {
    const rewardCoinName =
      query.utils.getSpoolRewardCoinName(stakeMarketCoinName);
    return rewardCoinName;
  });
  const coinPrices = await query.utils.getCoinPrices(
    [...new Set([...stakeCoinNames, ...rewardCoinNames])] ?? []
  );

  const marketPools = await query.getMarketPools(stakeCoinNames, indexer);
  const spools: Spools = {};

  if (indexer) {
    const spoolsIndexer = await query.indexer.getSpools();
    for (const spool of Object.values(spoolsIndexer)) {
      if (!stakeMarketCoinNames.includes(spool.marketCoinName)) continue;
      const coinName = query.utils.parseCoinName<SupportStakeCoins>(
        spool.marketCoinName
      );
      const rewardCoinName = query.utils.getSpoolRewardCoinName(
        spool.marketCoinName
      );
      const marketPool = marketPools[coinName];
      spool.coinPrice = coinPrices[coinName] || spool.coinPrice;
      spool.marketCoinPrice =
        (coinPrices[coinName] ?? 0) *
          (marketPool ? marketPool.conversionRate : 0) || spool.marketCoinPrice;
      spool.rewardCoinPrice =
        coinPrices[rewardCoinName] || spool.rewardCoinPrice;
      spools[spool.marketCoinName] = spool;
    }

    return spools;
  }

  for (const stakeMarketCoinName of stakeMarketCoinNames) {
    const stakeCoinName =
      query.utils.parseCoinName<SupportStakeCoins>(stakeMarketCoinName);
    const spool = await getSpool(
      query,
      stakeMarketCoinName,
      indexer,
      marketPools[stakeCoinName],
      coinPrices
    );

    if (spool) {
      spools[stakeMarketCoinName] = spool;
    }
  }

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
  marketPool?: MarketPool,
  coinPrices?: CoinPrices
) => {
  const coinName = query.utils.parseCoinName<SupportStakeCoins>(marketCoinName);
  marketPool = marketPool || (await query.getMarketPool(coinName, indexer));
  const poolId = query.address.get(`spool.pools.${marketCoinName}.id`);
  const rewardPoolId = query.address.get(
    `spool.pools.${marketCoinName}.rewardPoolId`
  );
  let spool: Spool | undefined = undefined;

  if (indexer) {
    const spoolIndexer = await query.indexer.getSpool(marketCoinName);
    const coinName =
      query.utils.parseCoinName<SupportStakeCoins>(marketCoinName);
    const rewardCoinName = query.utils.getSpoolRewardCoinName(marketCoinName);
    spoolIndexer.coinPrice = coinPrices?.[coinName] || spoolIndexer.coinPrice;
    spoolIndexer.marketCoinPrice =
      (coinPrices?.[coinName] ?? 0) *
        (marketPool ? marketPool.conversionRate : 0) ||
      spoolIndexer.marketCoinPrice;
    spoolIndexer.rewardCoinPrice =
      coinPrices?.[rewardCoinName] || spoolIndexer.rewardCoinPrice;

    return spoolIndexer;
  }

  const spoolObjectResponse = await query.suiKit.client().multiGetObjects({
    ids: [poolId, rewardPoolId],
    options: {
      showContent: true,
    },
  });

  if (
    marketPool &&
    spoolObjectResponse[0].data &&
    spoolObjectResponse[1].data
  ) {
    const rewardCoinName = query.utils.getSpoolRewardCoinName(marketCoinName);
    coinPrices =
      coinPrices ||
      (await query.utils.getCoinPrices([coinName, rewardCoinName]));

    const spoolObject = spoolObjectResponse[0].data;
    const rewardPoolObject = spoolObjectResponse[1].data;
    if (spoolObject.content && 'fields' in spoolObject.content) {
      const spoolFields = spoolObject.content.fields as any;
      const parsedSpoolData = parseOriginSpoolData({
        stakeType: spoolFields.stake_type,
        maxDistributedPoint: spoolFields.max_distributed_point,
        distributedPoint: spoolFields.distributed_point,
        distributedPointPerPeriod: spoolFields.distributed_point_per_period,
        pointDistributionTime: spoolFields.point_distribution_time,
        maxStake: spoolFields.max_stakes,
        stakes: spoolFields.stakes,
        index: spoolFields.index,
        createdAt: spoolFields.created_at,
        lastUpdate: spoolFields.last_update,
      });

      const marketCoinPrice =
        (coinPrices?.[coinName] ?? 0) * marketPool.conversionRate;
      const marketCoinDecimal = query.utils.getCoinDecimal(marketCoinName);
      const calculatedSpoolData = calculateSpoolData(
        parsedSpoolData,
        marketCoinPrice,
        marketCoinDecimal
      );

      if (rewardPoolObject.content && 'fields' in rewardPoolObject.content) {
        const rewardPoolFields = rewardPoolObject.content.fields as any;
        const parsedSpoolRewardPoolData = parseOriginSpoolRewardPoolData({
          claimed_rewards: rewardPoolFields.claimed_rewards,
          exchange_rate_numerator: rewardPoolFields.exchange_rate_numerator,
          exchange_rate_denominator: rewardPoolFields.exchange_rate_denominator,
          rewards: rewardPoolFields.rewards,
          spool_id: rewardPoolFields.spool_id,
        });

        const rewardCoinPrice = coinPrices?.[rewardCoinName] ?? 0;
        const rewardCoinDecimal = query.utils.getCoinDecimal(rewardCoinName);

        const calculatedRewardPoolData = calculateSpoolRewardPoolData(
          parsedSpoolData,
          parsedSpoolRewardPoolData,
          calculatedSpoolData,
          rewardCoinPrice,
          rewardCoinDecimal
        );

        spool = {
          marketCoinName: marketCoinName,
          symbol: query.utils.parseSymbol(marketCoinName),
          coinType: query.utils.parseCoinType(coinName),
          marketCoinType: query.utils.parseMarketCoinType(coinName),
          rewardCoinType: isMarketCoin(rewardCoinName)
            ? query.utils.parseMarketCoinType(rewardCoinName)
            : query.utils.parseCoinType(rewardCoinName),
          coinDecimal: query.utils.getCoinDecimal(coinName),
          rewardCoinDecimal: query.utils.getCoinDecimal(rewardCoinName),
          coinPrice: coinPrices?.[coinName] ?? 0,
          marketCoinPrice: marketCoinPrice,
          rewardCoinPrice: rewardCoinPrice,
          maxPoint: parsedSpoolData.maxPoint,
          distributedPoint: parsedSpoolData.distributedPoint,
          maxStake: parsedSpoolData.maxStake,
          ...calculatedSpoolData,
          exchangeRateNumerator:
            parsedSpoolRewardPoolData.exchangeRateNumerator,
          exchangeRateDenominator:
            parsedSpoolRewardPoolData.exchangeRateDenominator,
          ...calculatedRewardPoolData,
        };
      }
    }
  }

  return spool;
};

/**
 * Get all stake accounts of the owner.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - Owner address.
 * @return Stake accounts.
 */
export const getStakeAccounts = async (
  query: ScallopQuery,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const spoolObjectId = query.address.get('spool.object');
  const stakeAccountType = `${spoolObjectId}::spool_account::SpoolAccount`;
  const stakeObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;
  do {
    const paginatedStakeObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: { StructType: stakeAccountType },
        options: {
          showContent: true,
          showType: true,
        },
        cursor: nextCursor,
      });
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

  const stakeAccounts: StakeAccounts = {
    seth: [],
    ssui: [],
    susdc: [],
    susdt: [],
    scetus: [],
    safsui: [],
    shasui: [],
    svsui: [],
  };

  const stakeMarketCoinTypes: Record<SupportStakeMarketCoins, string> =
    Object.keys(stakeAccounts).reduce(
      (types, stakeMarketCoinName) => {
        const stakeCoinName =
          query.utils.parseCoinName<SupportStakeCoins>(stakeMarketCoinName);
        const marketCoinType = query.utils.parseMarketCoinType(stakeCoinName);

        types[
          stakeMarketCoinName as SupportStakeMarketCoins
        ] = `${spoolObjectId}::spool_account::SpoolAccount<${marketCoinType}>`;
        return types;
      },
      {} as Record<SupportStakeMarketCoins, string>
    );

  const stakeObjectIds: string[] = stakeObjectsResponse
    .map((ref: any) => ref?.data?.objectId)
    .filter((id: any) => id !== undefined);
  const stakeObjects = await query.suiKit.getObjects(stakeObjectIds);
  for (const stakeObject of stakeObjects) {
    const id = stakeObject.objectId;
    const type = stakeObject.type!;
    if (stakeObject.content && 'fields' in stakeObject.content) {
      const fields = stakeObject.content.fields as any;
      const stakePoolId = String(fields.spool_id);
      const stakeType = String(fields.stake_type.fields.name);
      const staked = Number(fields.stakes);
      const index = Number(fields.index);
      const points = Number(fields.points);
      const totalPoints = Number(fields.total_points);
      if (normalizeStructTag(type) === stakeMarketCoinTypes.seth) {
        stakeAccounts.seth.push({
          id,
          type: normalizeStructTag(type),
          stakePoolId,
          stakeType: normalizeStructTag(stakeType),
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.ssui) {
        stakeAccounts.ssui.push({
          id,
          type: normalizeStructTag(type),
          stakePoolId,
          stakeType: normalizeStructTag(stakeType),
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.susdc) {
        stakeAccounts.susdc.push({
          id,
          type: normalizeStructTag(type),
          stakePoolId,
          stakeType: normalizeStructTag(stakeType),
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.susdt) {
        stakeAccounts.susdt.push({
          id,
          type: normalizeStructTag(type),
          stakePoolId,
          stakeType: normalizeStructTag(stakeType),
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.scetus) {
        stakeAccounts.scetus.push({
          id,
          type: normalizeStructTag(type),
          stakePoolId,
          stakeType: normalizeStructTag(stakeType),
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.safsui) {
        stakeAccounts.safsui.push({
          id,
          type: normalizeStructTag(type),
          stakePoolId,
          stakeType: normalizeStructTag(stakeType),
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.shasui) {
        stakeAccounts.shasui.push({
          id,
          type: normalizeStructTag(type),
          stakePoolId,
          stakeType: normalizeStructTag(stakeType),
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.svsui) {
        stakeAccounts.svsui.push({
          id,
          type: normalizeStructTag(type),
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
  query: ScallopQuery,
  marketCoinName: SupportStakeMarketCoins
) => {
  const poolId = query.address.get(`spool.pools.${marketCoinName}.id`);
  let stakePool: StakePool | undefined = undefined;
  const stakePoolObjectResponse = await query.suiKit.client().getObject({
    id: poolId,
    options: {
      showContent: true,
      showType: true,
    },
  });
  if (stakePoolObjectResponse.data) {
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
  query: ScallopQuery,
  marketCoinName: SupportStakeMarketCoins
) => {
  const poolId = query.address.get(
    `spool.pools.${marketCoinName}.rewardPoolId`
  );
  let stakeRewardPool: StakeRewardPool | undefined = undefined;
  const stakeRewardPoolObjectResponse = await query.suiKit.client().getObject({
    id: poolId,
    options: {
      showContent: true,
      showType: true,
    },
  });
  if (stakeRewardPoolObjectResponse.data) {
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
