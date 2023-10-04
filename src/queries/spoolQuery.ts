import { normalizeStructTag } from '@mysten/sui.js/utils';
import {
  parseOriginStakePoolData,
  calculateStakePoolData,
  parseOriginRewardPoolData,
  calculateRewardPoolData,
  isMarketCoin,
} from '../utils';
import type { ScallopQuery } from '../models';
import type { SuiObjectResponse } from '@mysten/sui.js/client';
import type {
  MarketPool,
  Spools,
  Spool,
  StakePool,
  RewardPool,
  StakeAccounts,
  SupportStakeMarketCoins,
  SupportCoins,
  SupportStakeCoins,
} from '../types';
import { SUPPORT_SPOOLS } from 'src/constants';

/**
 * Get spools data.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinNames - Specific an array of support stake market coins.
 * @return Spools data.
 */
export const getSpools = async (
  query: ScallopQuery,
  marketCoinNames?: SupportStakeMarketCoins[]
) => {
  marketCoinNames = marketCoinNames || [...SUPPORT_SPOOLS];
  const coinNames = marketCoinNames.map(
    (marketCoinName) => marketCoinName.slice(1) as SupportStakeCoins
  );
  const marketPool = await query.getMarketPools(coinNames);
  const spools: Spools = {};
  for (const marketCoinName of marketCoinNames) {
    const coinName = marketCoinName.slice(1) as SupportStakeCoins;
    const spool = await getSpool(query, marketCoinName, marketPool[coinName]);

    if (spool) {
      spools[marketCoinName] = spool;
    }
  }

  return spools;
};

/**
 * Get spool data.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinName - Support stake market coins.
 * @param marketPool - The market pool data.
 * @return Spool data.
 */
export const getSpool = async (
  query: ScallopQuery,
  marketCoinName: SupportStakeMarketCoins,
  marketPool?: MarketPool
) => {
  const coinName = marketCoinName.slice(1) as SupportStakeCoins;
  marketPool = marketPool || (await query.getMarketPool(coinName));
  const poolId = query.address.get(`spool.pools.${marketCoinName}.id`);
  const rewardPoolId = query.address.get(
    `spool.pools.${marketCoinName}.rewardPoolId`
  );
  let spool: Spool | undefined = undefined;
  const stakePoolObjectResponse = await query.suiKit.client().multiGetObjects({
    ids: [poolId, rewardPoolId],
    options: {
      showContent: true,
    },
  });

  if (
    marketPool &&
    stakePoolObjectResponse[0].data &&
    stakePoolObjectResponse[1].data
  ) {
    const coinName = marketCoinName.slice(1) as SupportStakeCoins;
    const rewardCoin = query.utils.getRewardCoinName(marketCoinName);
    const coinPrices = await query.utils.getCoinPrices([coinName, rewardCoin]);

    const stakePoolObject = stakePoolObjectResponse[0].data;
    const rewardPoolObject = stakePoolObjectResponse[1].data;
    if (stakePoolObject.content && 'fields' in stakePoolObject.content) {
      const fields = stakePoolObject.content.fields as any;
      const parsedStakePoolData = parseOriginStakePoolData({
        stakeType: fields.stake_type,
        maxDistributedPoint: fields.max_distributed_point,
        distributedPoint: fields.distributed_point,
        distributedPointPerPeriod: fields.distributed_point_per_period,
        pointDistributionTime: fields.point_distribution_time,
        maxStake: fields.max_stakes,
        stakes: fields.stakes,
        index: fields.index,
        createdAt: fields.created_at,
        lastUpdate: fields.last_update,
      });

      const stakeMarketCoinPrice =
        (coinPrices?.[coinName] ?? 0) * marketPool.conversionRate;
      const stakeMarketCoinDecimal = query.utils.getCoinDecimal(coinName);
      const calculatedStakePoolData = calculateStakePoolData(
        parsedStakePoolData,
        stakeMarketCoinPrice,
        stakeMarketCoinDecimal
      );

      if (rewardPoolObject.content && 'fields' in rewardPoolObject.content) {
        const fields = rewardPoolObject.content.fields as any;
        const parsedRewardPoolData = parseOriginRewardPoolData({
          claimed_rewards: fields.claimed_rewards,
          exchange_rate_numerator: fields.exchange_rate_numerator,
          exchange_rate_denominator: fields.exchange_rate_denominator,
          rewards: fields.rewards,
          spool_id: fields.spool_id,
        });

        const rewardCoinPrice = coinPrices?.[rewardCoin] ?? 0;
        const rewardCoinDecimal = query.utils.getCoinDecimal(rewardCoin);

        const calculatedRewardPoolData = calculateRewardPoolData(
          parsedStakePoolData,
          parsedRewardPoolData,
          calculatedStakePoolData,
          rewardCoinPrice,
          rewardCoinDecimal
        );

        spool = {
          marketCoin: marketCoinName,
          symbol: query.utils.parseSymbol(coinName),
          coinType: query.utils.parseCoinType(coinName),
          marketCoinType: query.utils.parseMarketCoinType(coinName),
          rewardCoinType: isMarketCoin(rewardCoin)
            ? query.utils.parseMarketCoinType(rewardCoin)
            : query.utils.parseCoinType(rewardCoin),
          coinDecimal: query.utils.getCoinDecimal(coinName),
          rewardCoinDecimal: query.utils.getCoinDecimal(rewardCoin),
          coinPrice: coinPrices?.[coinName] ?? 0,
          marketCoinPrice: stakeMarketCoinPrice,
          rewardCoinPrice: rewardCoinPrice,
          ...calculatedStakePoolData,
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
  const spoolPkgId = query.address.get('spool.id');
  const stakeAccountType = `${spoolPkgId}::spool_account::SpoolAccount`;
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
    }
  } while (hasNextPage);

  const stakeAccounts: StakeAccounts = {
    ssui: [],
    susdc: [],
    susdt: [],
  };

  const stakeMarketCoinTypes: Record<SupportStakeMarketCoins, string> =
    Object.keys(stakeAccounts).reduce(
      (types, marketCoinName) => {
        const coinName = marketCoinName.slice(1) as SupportCoins;
        const marketCoinType = query.utils.parseMarketCoinType(coinName);

        types[
          marketCoinName as SupportStakeMarketCoins
        ] = `${spoolPkgId}::spool_account::SpoolAccount<${marketCoinType}>`;
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
      if (normalizeStructTag(type) === stakeMarketCoinTypes.ssui) {
        stakeAccounts.ssui.push({
          id,
          type,
          stakePoolId,
          stakeType,
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.susdc) {
        stakeAccounts.susdc.push({
          id,
          type,
          stakePoolId,
          stakeType,
          staked,
          index,
          points,
          totalPoints,
        });
      } else if (normalizeStructTag(type) === stakeMarketCoinTypes.susdt) {
        stakeAccounts.susdt.push({
          id,
          type,
          stakePoolId,
          stakeType,
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
 * @param query - The Scallop query instance.
 * @param marketCoinName - Support stake market coins.
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
        type,
        maxPoint,
        distributedPoint,
        pointPerPeriod,
        period,
        maxStake,
        stakeType,
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
 * Get reward pool of the owner.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinName - Support stake market coins.
 * @return Reward pool.
 */
export const getRewardPool = async (
  query: ScallopQuery,
  marketCoinName: SupportStakeMarketCoins
) => {
  const poolId = query.address.get(
    `spool.pools.${marketCoinName}.rewardPoolId`
  );
  let rewardPool: RewardPool | undefined = undefined;
  const rewardPoolObjectResponse = await query.suiKit.client().getObject({
    id: poolId,
    options: {
      showContent: true,
      showType: true,
    },
  });
  if (rewardPoolObjectResponse.data) {
    const rewardPoolObject = rewardPoolObjectResponse.data;
    const id = rewardPoolObject.objectId;
    const type = rewardPoolObject.type!;
    if (rewardPoolObject.content && 'fields' in rewardPoolObject.content) {
      const fields = rewardPoolObject.content.fields as any;
      const stakePoolId = String(fields.spool_id);
      const ratioNumerator = Number(fields.exchange_rate_numerator);
      const ratioDenominator = Number(fields.exchange_rate_denominator);
      const rewards = Number(fields.rewards);
      const claimedRewards = Number(fields.claimed_rewards);
      rewardPool = {
        id,
        type,
        stakePoolId,
        ratioNumerator,
        ratioDenominator,
        rewards,
        claimedRewards,
      };
    }
  }
  return rewardPool;
};
