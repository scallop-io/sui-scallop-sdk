import { normalizeStructTag, parseStructTag } from '@mysten/sui.js/utils';
import { SUPPORT_SPOOLS } from '../constants';
import {
  parseOriginSpoolData,
  calculateSpoolData,
  calculateSpoolRewardPoolData,
  parseOriginSpoolRewardData,
} from '../utils';
import type {
  DynamicFieldInfo,
  DynamicFieldPage,
  SuiObjectResponse,
} from '@mysten/sui.js/client';
import type { ScallopQuery } from '../models';
import type {
  MarketPool,
  Spools,
  Spool,
  SupportStakeMarketCoins,
  SupportStakeCoins,
  CoinPrices,
  SupportStakeRewardCoins,
  SupportAssetCoins,
  StakeAccount,
  StakeAccountReward,
  StakeAccountIds,
  OriginSpoolRewardData,
  SpoolRewardData,
  OriginStakeAccountKey,
  OriginStakeAccount,
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

  const coinPricesSet = new Set<SupportAssetCoins>();
  stakeCoinNames.forEach((coinName) => coinPricesSet.add(coinName));
  stakeMarketCoinNames.forEach((stakeMarketCoinName) => {
    const rewardCoinNames =
      query.utils.getSpoolRewardCoinName(stakeMarketCoinName);
    rewardCoinNames.forEach((rewardCoinName) =>
      coinPricesSet.add(rewardCoinName)
    );
  });

  const marketPools = await query.getMarketPools(stakeCoinNames, indexer);
  const spools: Spools = {};

  const coinPrices = await query.utils.getCoinPrices(Array.from(coinPricesSet));

  if (indexer) {
    // TODO: Implement indexer for new spool model
    // const spoolsIndexer = await .indexer.getSpools();
    // for (const spool of Object.values(spoolsIndexer)) {
    //   if (!stakeMarketCoinNames.includes(spool.marketCoinName)) continue;
    //   const coinName = query.utils.parseCoinName<SupportStakeCoins>(
    //     spool.marketCoinName
    //   );
    //   const rewardCoinName = query.utils.getSpoolRewardCoinName(
    //     spool.marketCoinName
    //   );
    //   const marketPool = marketPools[coinName];
    //   spool.coinPrice = coinPrices[coinName] || spool.coinPrice;
    //   spool.marketCoinPrice =
    //     (coinPrices[coinName] ?? 0) *
    //       (marketPool ? marketPool.conversionRate : 0) || spool.marketCoinPrice;
    //   spool.rewardCoinPrice =
    //     coinPrices[rewardCoinName] || spool.rewardCoinPrice;
    //   spools[spool.marketCoinName] = spool;
    // }
    // return spools;
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
): Promise<Spool | undefined> => {
  const coinName = query.utils.parseCoinName<SupportStakeCoins>(marketCoinName);
  marketPool = marketPool || (await query.getMarketPool(coinName, indexer));
  const poolId = query.address.get(`spool.pools.${marketCoinName}.id`);
  let spool: Spool | undefined = undefined;

  if (indexer) {
    // TODO: Implement indexer for new spool model
    // const spoolIndexer = await query.indexer.getSpool(marketCoinName);
    // const coinName =
    //   query.utils.parseCoinName<SupportStakeCoins>(marketCoinName);
    // const rewardCoinName = query.utils.getSpoolRewardCoinName(marketCoinName);
    // spoolIndexer.coinPrice = coinPrices?.[coinName] || spoolIndexer.coinPrice;
    // spoolIndexer.marketCoinPrice =
    //   (coinPrices?.[coinName] ?? 0) *
    //     (marketPool ? marketPool.conversionRate : 0) ||
    //   spoolIndexer.marketCoinPrice;
    // spoolIndexer.rewardCoinPrice =
    //   coinPrices?.[rewardCoinName] || spoolIndexer.rewardCoinPrice;
    // return spoolIndexer;
  }

  const spoolObjectResponse = await query.suiKit.client().getObject({
    id: poolId,
    options: {
      showContent: true,
    },
  });

  if (marketPool && spoolObjectResponse.data) {
    const rewardCoinName = query.utils.getSpoolRewardCoinName(marketCoinName);
    coinPrices =
      coinPrices ||
      (await query.utils.getCoinPrices([coinName, ...rewardCoinName]));

    const spoolObject = spoolObjectResponse.data;
    // const rewardPoolObject = spoolObjectResponse[1].data;
    if (spoolObject.content && 'fields' in spoolObject.content) {
      const spoolFields = spoolObject.content.fields as any;
      const parsedSpoolData = parseOriginSpoolData(spoolFields);

      const marketCoinPrice =
        (coinPrices?.[coinName] ?? 0) * marketPool.conversionRate;
      const marketCoinDecimal = query.utils.getCoinDecimal(marketCoinName);
      const spoolRewards: Partial<
        Record<SupportStakeRewardCoins, SpoolRewardData>
      > = {};

      // calculate spool data
      const calculatedSpoolData = calculateSpoolData(
        parsedSpoolData,
        marketCoinPrice,
        marketCoinDecimal
      );

      const spoolRewardTableId = spoolFields.rewards?.fields.id.id;
      const originSpoolRewards: OriginSpoolRewardData[] = [];
      if (spoolRewardTableId) {
        // query spool reward objects
        let cursor;
        let nextPage = true;
        do {
          const { data, nextCursor, hasNextPage } = await query.suiKit
            .client()
            .getDynamicFields({
              parentId: spoolRewardTableId,
              limit: 50,
              cursor: cursor,
            });

          const spoolRewardObjectIds = data.map((field) => field.objectId);
          const spoolRewardObjects = await query.suiKit.getObjects(
            spoolRewardObjectIds,
            {
              showContent: true,
              showType: true,
            }
          );

          originSpoolRewards.push(
            ...(spoolRewardObjects
              .map((object) => {
                if (object.content?.dataType === 'moveObject') {
                  const objectFields = object.content.fields as any;
                  const valueFields = objectFields.value
                    .fields as OriginSpoolRewardData;
                  const rewardCoinName = normalizeStructTag(
                    objectFields.name.fields.name
                  );
                  valueFields.type = rewardCoinName;
                  return valueFields;
                }
              })
              .filter((item) => item !== undefined) as OriginSpoolRewardData[])
          );
          cursor = nextCursor;
          nextPage = hasNextPage;
        } while (nextPage);
      }

      // calculate spool reward data
      for (const originSpoolReward of originSpoolRewards) {
        const rewardCoinName = query.utils.parseCoinNameFromType(
          originSpoolReward.type
        ) as SupportStakeRewardCoins;
        const rewardCoinType = query.utils.parseCoinType(rewardCoinName);
        const rewardCoinPrice = coinPrices?.[rewardCoinName] ?? 0;
        const rewardCoinDecimal = query.utils.getCoinDecimal(rewardCoinName);
        const parsedOriginSpoolReward =
          parseOriginSpoolRewardData(originSpoolReward);
        const calculatedSpoolReward = calculateSpoolRewardPoolData(
          parsedOriginSpoolReward,
          calculatedSpoolData,
          rewardCoinPrice,
          rewardCoinDecimal
        );

        const symbol = query.utils.parseSymbol(rewardCoinName);

        spoolRewards[rewardCoinName as SupportStakeRewardCoins] = {
          symbol,
          coinName: rewardCoinName,
          coinType: rewardCoinType,
          coinDecimal: rewardCoinDecimal,
          coinPrice: rewardCoinPrice,
          ...calculatedSpoolReward,
        };
      }

      // calculate boost if available

      spool = {
        marketCoinName: marketCoinName,
        symbol: query.utils.parseSymbol(marketCoinName),
        coinType: query.utils.parseCoinType(coinName),
        marketCoinType: query.utils.parseMarketCoinType(coinName),
        coinDecimal: query.utils.getCoinDecimal(coinName),
        coinPrice: coinPrices?.[coinName] ?? 0,
        marketCoinPrice: marketCoinPrice,
        maxStake: parsedSpoolData.maxStake,
        staked: parsedSpoolData.staked,
        rewards: spoolRewards,
        ...calculatedSpoolData,
      };
    }
  }

  return spool;
};

/**
 * Get stake account
 */
export const getStakeAccount = async (
  query: ScallopQuery,
  stakeMarketCoinName: SupportStakeMarketCoins,
  stakeAccountKey: string,
  stakeAccountId?: string
): Promise<StakeAccount | undefined> => {
  const stakeAccountIds = await getStakeAccountIds(
    query,
    stakeMarketCoinName,
    stakeAccountKey,
    stakeAccountId
  );

  let stakeAccount: StakeAccount | undefined = undefined;
  if (stakeAccountIds) {
    const stakeAccountObjectResponse = await query.suiKit.client().getObject({
      id: stakeAccountIds.id,
      options: {
        showContent: true,
        showType: true,
      },
    });

    const stakeAccountObject = stakeAccountObjectResponse.data;
    if (
      stakeAccountObject &&
      stakeAccountObject.content &&
      'fields' in stakeAccountObject.content
    ) {
      const type = normalizeStructTag(stakeAccountObject.type!);
      const fields = stakeAccountObject.content
        .fields as any as OriginStakeAccount;
      const stakePoolId = String(fields.spool_id.fields.id);
      const stakeType = normalizeStructTag(
        String(fields.stake_type.fields.name)
      );
      const staked = Number(fields.stakes);
      const bindedVeScaKey = fields.binded_ve_sca_key
        ? String(fields.binded_ve_sca_key)
        : null;
      const rewardTableId = fields.rewards.fields.id.id;

      // fetch all reward in the rewards table
      let cursor: string | null | undefined = null;
      let nextPage = true;
      const rewards: Partial<
        Record<SupportStakeRewardCoins, StakeAccountReward>
      > = {};

      do {
        const { data, nextCursor, hasNextPage }: DynamicFieldPage =
          await query.suiKit.client().getDynamicFields({
            parentId: rewardTableId,
            cursor,
            limit: 50,
          });

        // query the SpoolAccountReward objectIds
        const spoolAccountRewardObjectIds = data.map(
          (field: DynamicFieldInfo) => field.objectId
        );
        const spoolAccountRewardObjects = await query.suiKit
          .client()
          .multiGetObjects({
            ids: spoolAccountRewardObjectIds,
            options: {
              showContent: true,
            },
          });

        spoolAccountRewardObjects.reduce((acc, rewardObject) => {
          if (rewardObject.data?.content?.dataType === 'moveObject') {
            const fields = rewardObject.data.content.fields as any;
            const valueFields = fields.value.fields;
            const rewardCoinName = parseStructTag(
              fields.name.fields.name
            ).name.toLowerCase() as SupportStakeRewardCoins;
            acc[rewardCoinName] = {
              weightedAmount: Number(valueFields.weighted_amount),
              points: Number(valueFields.points),
              totalPoints: Number(valueFields.total_points),
              index: Number(valueFields.index),
            };
          }
          return acc;
        }, rewards);

        cursor = nextCursor;
        nextPage = hasNextPage;
      } while (nextPage);

      stakeAccount = {
        ...stakeAccountIds,
        type,
        stakePoolId,
        stakeType: stakeType,
        staked,
        bindedVeScaKey,
        rewards,
      };
    }
  }

  return stakeAccount;
};

/**
 * Get stake account id and keyId
 * @param query
 * @param stakeMarketCoinName
 * @param stakeAccountId
 * @param stakeAccountKey
 */
export const getStakeAccountIds = async (
  query: ScallopQuery,
  stakeMarketCoinName: SupportStakeMarketCoins,
  stakeAccountKey: string,
  stakeAccountId?: string
): Promise<StakeAccountIds | undefined> => {
  stakeAccountId =
    stakeAccountId ||
    (await (async () => {
      const stakeAccountKeyObject = await query.suiKit.suiInteractor.getObject(
        stakeAccountKey,
        {
          showContent: true,
        }
      );
      if (
        stakeAccountKeyObject.content &&
        'fields' in stakeAccountKeyObject.content
      ) {
        const fields = stakeAccountKeyObject.content
          .fields as any as OriginStakeAccountKey;
        const queriedStakeAccountId = fields.spool_account_id;
        return queriedStakeAccountId;
      }
    })());

  return stakeAccountId
    ? {
        id: stakeAccountId,
        keyId: stakeAccountKey,
        stakeType: query.utils.parseMarketCoinType(stakeMarketCoinName),
      }
    : undefined;
};

/**
 * Get all stake account id and keyIds
 * @param query - The Scallop query instance.
 * @param ownerAddress - Owner address.
 * @return Stake accounts.
 */
export const getStakeAccountsIds = async (
  query: ScallopQuery,
  stakeMarketCoinName: SupportStakeMarketCoins,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const spoolObjectId = query.address.get('spool.object');
  const stakeAccountKey = `${spoolObjectId}::spool_account::SpoolAccountKey`;
  const stakeType = query.utils.parseMarketCoinType(stakeMarketCoinName);
  const keyObjectsResponse: SuiObjectResponse[] = [];

  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;

  do {
    const paginatedKeyObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: {
          StructType: stakeAccountKey,
        },
        options: {
          showContent: true,
        },
        cursor: nextCursor,
      });
    keyObjectsResponse.push(...paginatedKeyObjectsResponse.data);
    if (
      paginatedKeyObjectsResponse.hasNextPage &&
      paginatedKeyObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedKeyObjectsResponse.nextCursor;
    } else {
      hasNextPage = false;
    }
  } while (hasNextPage);

  const stakeAccountsIds: StakeAccountIds[] = keyObjectsResponse
    .map((ref) => {
      if (ref.data?.content?.dataType === 'moveObject') {
        const fields = ref.data.content.fields as any as OriginStakeAccountKey;
        return {
          id: fields.spool_account_id,
          keyId: ref.data.objectId,
          stakeType: normalizeStructTag(fields.spool_stake_type.fields.name),
        } as StakeAccountIds;
      }
    })
    .filter(
      (ids) => ids !== undefined && ids.stakeType === stakeType
    ) as StakeAccountIds[];

  return stakeAccountsIds;
};

/**
 * Get all stake accounts with stakeType stakeMarketCoinName of the owner.
 *
 * @param query - The Scallop query instance.
 * @param stakeMarketCoinName - Specific support stake market coin name.
 * @param ownerAddress - Owner address.
 * @return Stake accounts.
 */
export const getStakeAccounts = async (
  query: ScallopQuery,
  stakeMarketCoinName: SupportStakeMarketCoins,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const stakeAccountsIds = await getStakeAccountsIds(
    query,
    stakeMarketCoinName,
    owner
  );
  const stakeAccounts: StakeAccount[] = [];
  for (const stakeAccountIds of stakeAccountsIds) {
    const { keyId, id } = stakeAccountIds;
    const stakeAccount = await getStakeAccount(
      query,
      stakeMarketCoinName,
      keyId,
      id
    );
    if (stakeAccount) stakeAccounts.push(stakeAccount);
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
// export const getStakePool = async (
//   query: ScallopQuery,
//   marketCoinName: SupportStakeMarketCoins
// ) => {
//   const poolId = query.address.get(`spool.pools.${marketCoinName}.id`);
//   let stakePool: StakePool | undefined = undefined;
//   const stakePoolObjectResponse = await query.suiKit.client().getObject({
//     id: poolId,
//     options: {
//       showContent: true,
//       showType: true,
//     },
//   });
//   if (stakePoolObjectResponse.data) {
//     const stakePoolObject = stakePoolObjectResponse.data;
//     const id = stakePoolObject.objectId;
//     const type = stakePoolObject.type!;
//     if (stakePoolObject.content && 'fields' in stakePoolObject.content) {
//       const fields = stakePoolObject.content.fields as any;
//       const maxPoint = Number(fields.max_distributed_point);
//       const distributedPoint = Number(fields.distributed_point);
//       const pointPerPeriod = Number(fields.distributed_point_per_period);
//       const period = Number(fields.point_distribution_time);
//       const maxStake = Number(fields.max_stakes);
//       const stakeType = String(fields.stake_type.fields.name);
//       const totalStaked = Number(fields.stakes);
//       const index = Number(fields.index);
//       const lastUpdate = Number(fields.last_update);
//       stakePool = {
//         id,
//         type: normalizeStructTag(type),
//         maxPoint,
//         distributedPoint,
//         pointPerPeriod,
//         period,
//         maxStake,
//         stakeType: normalizeStructTag(stakeType),
//         totalStaked,
//         index,
//         lastUpdate,
//       };
//     }
//   }
//   return stakePool;
// };

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
// export const getStakeRewardPool = async (
//   query: ScallopQuery,
//   marketCoinName: SupportStakeMarketCoins
// ) => {
//   const poolId = query.address.get(
//     `spool.pools.${marketCoinName}.rewardPoolId`
//   );
//   let stakeRewardPool: StakeRewardPool | undefined = undefined;
//   const stakeRewardPoolObjectResponse = await query.suiKit.client().getObject({
//     id: poolId,
//     options: {
//       showContent: true,
//       showType: true,
//     },
//   });
//   if (stakeRewardPoolObjectResponse.data) {
//     const stakeRewardPoolObject = stakeRewardPoolObjectResponse.data;
//     const id = stakeRewardPoolObject.objectId;
//     const type = stakeRewardPoolObject.type!;
//     if (
//       stakeRewardPoolObject.content &&
//       'fields' in stakeRewardPoolObject.content
//     ) {
//       const rewardPoolFields = stakeRewardPoolObject.content.fields as any;
//       const stakePoolId = String(rewardPoolFields.spool_id);
//       const ratioNumerator = Number(rewardPoolFields.exchange_rate_numerator);
//       const ratioDenominator = Number(
//         rewardPoolFields.exchange_rate_denominator
//       );
//       const rewards = Number(rewardPoolFields.rewards);
//       const claimedRewards = Number(rewardPoolFields.claimed_rewards);

//       stakeRewardPool = {
//         id,
//         type: normalizeStructTag(type),
//         stakePoolId,
//         ratioNumerator,
//         ratioDenominator,
//         rewards,
//         claimedRewards,
//       };
//     }
//   }
//   return stakeRewardPool;
// };
