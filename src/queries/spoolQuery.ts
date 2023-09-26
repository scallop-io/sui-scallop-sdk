import {
  getObjectFields,
  getObjectType,
  getObjectId,
  normalizeStructTag,
} from '@mysten/sui.js';
import type { ScallopQuery } from '../models';
import type {
  StakePool,
  RewardPool,
  StakeAccount,
  SupportStakeMarketCoins,
  SupportCoins,
} from '../types';

/**
 * Get all stake accounts of the owner.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - Owner address.
 * @returns Stake accounts.
 */
export const getStakeAccounts = async (
  query: ScallopQuery,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const spoolPkgId = query.address.get('spool.id');
  const stakeAccountType = `${spoolPkgId}::spool_account::SpoolAccount`;
  const stakeObjects = await query.suiKit.provider().getOwnedObjects({
    owner,
    filter: { StructType: stakeAccountType },
    options: {
      showContent: true,
      showType: true,
    },
  });

  const stakeAccounts: Record<SupportStakeMarketCoins, StakeAccount[]> = {
    ssui: [],
    susdc: [],
    susdt: [],
  };

  const stakeCointTypes: Record<SupportStakeMarketCoins, string> = Object.keys(
    stakeAccounts
  ).reduce(
    (types, marketCoinName) => {
      const coinName = marketCoinName.slice(1) as SupportCoins;
      const coinPackageId = query.address.get(`core.coins.${coinName}.id`);
      const marketCoinType = query.utils.parseMarketCoinType(
        coinPackageId,
        coinName
      );

      types[
        marketCoinName as SupportStakeMarketCoins
      ] = `${spoolPkgId}::spool_account::SpoolAccount<${marketCoinType}>`;
      return types;
    },
    {} as Record<SupportStakeMarketCoins, string>
  );

  for (const object of stakeObjects.data) {
    const id = getObjectId(object) as string;
    const type = getObjectType(object) as string;

    const fields = getObjectFields(object) as any;
    const spoolId = String(fields.spool_id);
    const staked = Number(fields.stakes);
    const index = Number(fields.index);
    const points = Number(fields.points);

    if (normalizeStructTag(type) === stakeCointTypes.ssui) {
      stakeAccounts.ssui.push({ id, type, spoolId, staked, index, points });
    } else if (normalizeStructTag(type) === stakeCointTypes.susdc) {
      stakeAccounts.susdc.push({ id, type, spoolId, staked, index, points });
    } else if (normalizeStructTag(type) === stakeCointTypes.susdt) {
      stakeAccounts.susdt.push({ id, type, spoolId, staked, index, points });
    }
  }
  return stakeAccounts;
};

/**
 * Get stake account of the owner.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinName - Support stake market coins.
 * @return Stake account.
 */
export const getStakePool = async (
  query: ScallopQuery,
  marketCoinName: SupportStakeMarketCoins
) => {
  const poolId = query.address.get(`spool.pools.${marketCoinName}.id`);
  const poolObject = await query.suiKit.provider().getObject({
    id: poolId,
    options: { showContent: true },
  });
  const id = getObjectId(poolObject) as string;
  const type = getObjectType(poolObject) as string;
  const fields = getObjectFields(poolObject) as any;
  const lastUpdate = Number(fields.last_update);
  const index = Number(fields.index);
  const totalStaked = Number(fields.stakes);
  const maxStake = Number(fields.max_stakes);
  const distributedPoint = Number(fields.distributed_point);
  const maxPoint = Number(fields.max_distributed_point);
  const pointPerPeriod = Number(fields.distributed_point_per_period);
  const period = Number(fields.point_distribution_time);
  const createdAt = Number(fields.created_at);

  const stakePool: StakePool = {
    id,
    type,
    lastUpdate,
    index,
    totalStaked,
    maxStake,
    distributedPoint,
    maxPoint,
    pointPerPeriod,
    period,
    createdAt,
  };

  return stakePool;
};

/**
 * Get reward pool of the owner.
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

  const poolObject = await query.suiKit.provider().getObject({
    id: poolId,
    options: { showContent: true },
  });
  const id = getObjectId(poolObject) as string;
  const type = getObjectType(poolObject) as string;
  const fields = getObjectFields(poolObject) as any;
  const stakePoolId = String(fields.spool_id);
  const ratioNumerator = Number(fields.exchange_rate_numerator);
  const ratioDenominator = Number(fields.exchange_rate_denominator);
  const rewards = Number(fields.rewards);
  const claimedRewards = Number(fields.claimed_rewards);

  const rewardPool: RewardPool = {
    id,
    type,
    stakePoolId,
    ratioNumerator,
    ratioDenominator,
    rewards,
    claimedRewards,
  };

  return rewardPool;
};
