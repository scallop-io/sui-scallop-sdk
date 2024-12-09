import { normalizeStructTag } from '@mysten/sui/utils';
import {
  SUPPORT_BORROW_INCENTIVE_POOLS,
  SUPPORT_BORROW_INCENTIVE_REWARDS,
} from '../constants';
import {
  parseOriginBorrowIncentivePoolData,
  parseOriginBorrowIncentiveAccountData,
  calculateBorrowIncentivePoolPointData,
} from '../utils';
import type { ScallopAddress, ScallopQuery, ScallopUtils } from '../models';
import type {
  BorrowIncentivePoolsQueryInterface,
  BorrowIncentivePools,
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentiveAccounts,
  SupportBorrowIncentiveCoins,
  SupportBorrowIncentiveRewardCoins,
  BorrowIncentivePoolPoints,
  OptionalKeys,
  BorrowIncentivePool,
} from '../types';
import BigNumber from 'bignumber.js';

/**
 * Query borrow incentive pools data using moveCall
 * @param address
 * @returns
 */
export const queryBorrowIncentivePools = async (address: ScallopAddress) => {
  const queryPkgId = address.get('borrowIncentive.query');
  const incentivePoolsId = address.get('borrowIncentive.incentivePools');

  const queryTarget = `${queryPkgId}::incentive_pools_query::incentive_pools_data`;
  const args = [incentivePoolsId];
  const queryResult = await address.cache.queryInspectTxn({
    queryTarget,
    args,
  });
  const borrowIncentivePoolsQueryData = queryResult?.events[0].parsedJson as
    | BorrowIncentivePoolsQueryInterface
    | undefined;
  return borrowIncentivePoolsQueryData;
};

/**
 * Get borrow incentive pools data.
 *
 * @param query - The Scallop query instance.
 * @param borrowIncentiveCoinNames - Specific an array of support borrow incentive coin name.
 * @param indexer - Whether to use indexer.
 * @return Borrow incentive pools data.
 */
export const getBorrowIncentivePools = async (
  query: ScallopQuery,
  borrowIncentiveCoinNames: SupportBorrowIncentiveCoins[] = [
    ...SUPPORT_BORROW_INCENTIVE_POOLS,
  ],
  indexer: boolean = false
) => {
  const borrowIncentivePools: BorrowIncentivePools = {};
  const borrowIncentiveRewardCoinNames = SUPPORT_BORROW_INCENTIVE_REWARDS.map(
    (t) => query.utils.parseCoinName(t)
  );
  const coinPrices =
    (await query.utils.getCoinPrices([
      ...new Set([
        ...borrowIncentiveCoinNames,
        ...borrowIncentiveRewardCoinNames,
      ]),
    ])) ?? {};

  const marketPools = await query.getMarketPools(
    borrowIncentiveRewardCoinNames
  );
  if (indexer) {
    const borrowIncentivePoolsIndexer =
      await query.indexer.getBorrowIncentivePools();

    const updateBorrowIncentivePool = (pool: BorrowIncentivePool) => {
      if (!borrowIncentiveCoinNames.includes(pool.coinName)) return;
      pool.coinPrice = coinPrices[pool.coinName] || pool.coinPrice;
      borrowIncentivePools[pool.coinName] = pool;
    };

    Object.values(borrowIncentivePoolsIndexer).forEach(
      updateBorrowIncentivePool
    );

    return borrowIncentivePools;
  }

  const borrowIncentivePoolsQueryData = await queryBorrowIncentivePools(
    query.address
  );

  for (const pool of borrowIncentivePoolsQueryData?.incentive_pools ?? []) {
    const borrowIncentivePoolPoints: OptionalKeys<
      Record<SupportBorrowIncentiveRewardCoins, BorrowIncentivePoolPoints>
    > = {};
    const parsedBorrowIncentivePoolData =
      parseOriginBorrowIncentivePoolData(pool);

    const poolCoinType = normalizeStructTag(pool.pool_type.name);
    const poolCoinName =
      query.utils.parseCoinNameFromType<SupportBorrowIncentiveCoins>(
        poolCoinType
      );

    const poolCoinPrice = coinPrices?.[poolCoinName] ?? 0;
    const poolCoinDecimal = query.utils.getCoinDecimal(poolCoinName);

    // Filter pools not yet supported by the SDK.
    if (!borrowIncentiveCoinNames.includes(poolCoinName)) {
      continue;
    }
    // pool points for borrow incentive reward ('sui' and 'sca')
    for (const [coinName, poolPoint] of Object.entries(
      parsedBorrowIncentivePoolData.poolPoints
    )) {
      const rewardSCoinType = normalizeStructTag(poolPoint.pointType);
      const rewardSCoinName =
        query.utils.parseCoinNameFromType<SupportBorrowIncentiveRewardCoins>(
          rewardSCoinType
        );
      const rewardCoinName = query.utils.parseCoinName(rewardSCoinName);
      const rewardCoinPrice =
        coinPrices?.[query.utils.parseCoinName(rewardSCoinName)] ?? 0;
      const rewardSCoinPrice =
        rewardCoinPrice * (marketPools[rewardCoinName]?.conversionRate ?? 1);
      const rewardCoinDecimal = query.utils.getCoinDecimal(rewardCoinName);

      const symbol = query.utils.parseSymbol(rewardCoinName);
      const coinDecimal = query.utils.getCoinDecimal(rewardCoinName);

      const calculatedPoolPoint = calculateBorrowIncentivePoolPointData(
        // parsedBorrowIncentivePoolData,
        poolPoint,
        rewardCoinPrice,
        rewardCoinDecimal,
        poolCoinPrice,
        poolCoinDecimal
      );

      borrowIncentivePoolPoints[coinName as SupportBorrowIncentiveRewardCoins] =
        {
          symbol,
          coinName: rewardSCoinName,
          coinType: rewardSCoinType,
          coinDecimal,
          coinPrice: rewardSCoinPrice,
          points: poolPoint.points,
          distributedPoint: poolPoint.distributedPoint,
          weightedAmount: poolPoint.weightedAmount,
          ...calculatedPoolPoint,
        };
    }

    const stakedAmount = BigNumber(parsedBorrowIncentivePoolData.staked);
    const stakedCoin = stakedAmount.shiftedBy(-1 * poolCoinDecimal);
    const stakedValue = stakedCoin.multipliedBy(poolCoinPrice);

    borrowIncentivePools[poolCoinName] = {
      coinName: poolCoinName,
      symbol: query.utils.parseSymbol(poolCoinName),
      coinType: poolCoinType,
      coinDecimal: poolCoinDecimal,
      coinPrice: poolCoinPrice,
      stakedAmount: stakedAmount.toNumber(),
      stakedCoin: stakedCoin.toNumber(),
      stakedValue: stakedValue.toNumber(),
      points: borrowIncentivePoolPoints,
    };
  }

  return borrowIncentivePools;
};

/**
 * Query borrow incentive accounts data.
 *
 * @param query - The Scallop query instance.
 * @param borrowIncentiveCoinNames - Specific an array of support borrow incentive coin name.
 * @return Borrow incentive accounts data.
 */
export const queryBorrowIncentiveAccounts = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  obligationId: string,
  borrowIncentiveCoinNames: SupportBorrowIncentiveCoins[] = [
    ...SUPPORT_BORROW_INCENTIVE_POOLS,
  ]
) => {
  const queryPkgId = utils.address.get('borrowIncentive.query');
  const incentiveAccountsId = utils.address.get(
    'borrowIncentive.incentiveAccounts'
  );
  const queryTarget = `${queryPkgId}::incentive_account_query::incentive_account_data`;
  const args = [incentiveAccountsId, obligationId];

  const queryResult = await utils.cache.queryInspectTxn({ queryTarget, args });
  const borrowIncentiveAccountsQueryData = queryResult?.events[0]
    ?.parsedJson as BorrowIncentiveAccountsQueryInterface | undefined;

  const borrowIncentiveAccounts: BorrowIncentiveAccounts = Object.values(
    borrowIncentiveAccountsQueryData?.pool_records ?? []
  ).reduce((accounts, accountData) => {
    const parsedBorrowIncentiveAccount =
      parseOriginBorrowIncentiveAccountData(accountData);
    const poolType = parsedBorrowIncentiveAccount.poolType;
    const coinName =
      utils.parseCoinNameFromType<SupportBorrowIncentiveCoins>(poolType);

    if (
      borrowIncentiveCoinNames &&
      borrowIncentiveCoinNames.includes(coinName)
    ) {
      accounts[coinName] = parsedBorrowIncentiveAccount;
    }

    return accounts;
  }, {} as BorrowIncentiveAccounts);

  return borrowIncentiveAccounts;
};

/**
 * Check veSca bind status
 * @param query
 * @param veScaKey
 * @returns
 */
export const getBindedObligationId = async (
  {
    address,
  }: {
    address: ScallopAddress;
  },
  veScaKeyId: string
): Promise<string | null> => {
  const borrowIncentiveObjectId = address.get('borrowIncentive.object');
  const incentivePoolsId = address.get('borrowIncentive.incentivePools');
  const veScaObjId = address.get('vesca.object');

  // get incentive pools
  const incentivePoolsResponse = await address.cache.queryGetObject(
    incentivePoolsId,
    {
      showContent: true,
    }
  );

  if (incentivePoolsResponse?.data?.content?.dataType !== 'moveObject')
    return null;
  const incentivePoolFields = incentivePoolsResponse.data.content.fields as any;
  const veScaBindTableId = incentivePoolFields.ve_sca_bind.fields.id
    .id as string;

  // check if veSca is inside the bind table
  const keyType = `${borrowIncentiveObjectId}::typed_id::TypedID<${veScaObjId}::ve_sca::VeScaKey>`;
  const veScaBindTableResponse = await address.cache.queryGetDynamicFieldObject(
    {
      parentId: veScaBindTableId,
      name: {
        type: keyType,
        value: veScaKeyId,
      },
    }
  );

  if (veScaBindTableResponse?.data?.content?.dataType !== 'moveObject')
    return null;
  const veScaBindTableFields = veScaBindTableResponse.data.content
    .fields as any;
  // get obligationId pair
  const obligationId = veScaBindTableFields.value.fields.id as string;

  return obligationId;
};

export const getBindedVeScaKey = async (
  {
    address,
  }: {
    address: ScallopAddress;
  },
  obligationId: string
): Promise<string | null> => {
  const borrowIncentiveObjectId = address.get('borrowIncentive.object');
  const incentiveAccountsId = address.get('borrowIncentive.incentiveAccounts');
  const corePkg = address.get('core.object');

  // get IncentiveAccounts object
  const incentiveAccountsObject = await address.cache.queryGetObject(
    incentiveAccountsId,
    {
      showContent: true,
    }
  );
  if (incentiveAccountsObject?.data?.content?.dataType !== 'moveObject')
    return null;
  const incentiveAccountsTableId = (
    incentiveAccountsObject.data.content.fields as any
  ).accounts.fields.id.id;

  // Search in the table
  const bindedIncentiveAcc = await address.cache.queryGetDynamicFieldObject({
    parentId: incentiveAccountsTableId,
    name: {
      type: `${borrowIncentiveObjectId}::typed_id::TypedID<${corePkg}::obligation::Obligation>`,
      value: obligationId,
    },
  });

  if (bindedIncentiveAcc?.data?.content?.dataType !== 'moveObject') return null;
  const bindedIncentiveAccFields = bindedIncentiveAcc.data.content
    .fields as any;

  return (
    bindedIncentiveAccFields.value.fields.binded_ve_sca_key?.fields.id ?? null
  );
};
