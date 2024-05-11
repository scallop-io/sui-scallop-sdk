import { normalizeStructTag } from '@mysten/sui.js/utils';
import {
  IS_VE_SCA_TEST,
  SUPPORT_BORROW_INCENTIVE_POOLS,
  SUPPORT_BORROW_INCENTIVE_REWARDS,
} from '../constants';
import {
  parseOriginBorrowIncentivePoolData,
  parseOriginBorrowIncentiveAccountData,
  calculateBorrowIncentivePoolPointData,
} from '../utils';
import type { ScallopQuery } from '../models';
import type {
  BorrowIncentivePoolsQueryInterface,
  BorrowIncentivePools,
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentiveAccounts,
  SupportBorrowIncentiveCoins,
  SupportBorrowIncentiveRewardCoins,
  BorrowIncentivePoolPoints,
  OptionalKeys,
} from '../types';

/**
 * Query borrow incentive pools data.
 *
 * @param query - The Scallop query instance.
 * @param borrowIncentiveCoinNames - Specific an array of support borrow incentive coin name.
 * @param indexer - Whether to use indexer.
 * @return Borrow incentive pools data.
 */
export const queryBorrowIncentivePools = async (
  query: ScallopQuery,
  borrowIncentiveCoinNames?: SupportBorrowIncentiveCoins[],
  indexer: boolean = false
) => {
  borrowIncentiveCoinNames = borrowIncentiveCoinNames || [
    ...SUPPORT_BORROW_INCENTIVE_POOLS,
  ];
  const queryPkgId = query.address.get('borrowIncentive.query');
  const incentivePoolsId = query.address.get('borrowIncentive.incentivePools');

  const queryTarget = `${queryPkgId}::incentive_pools_query::incentive_pools_data`;
  const args = [incentivePoolsId];
  const queryResult = await query.cache.queryInspectTxn({ queryTarget, args });
  const borrowIncentivePoolsQueryData = queryResult.events[0]
    .parsedJson as BorrowIncentivePoolsQueryInterface;

  const borrowIncentivePools: BorrowIncentivePools = {};

  if (indexer) {
    // TODO: Implement indexer query.
    // const borrowIncentivePoolsIndexer =
    //   await query.indexer.getBorrowIncentivePools();
    // for (const borrowIncentivePool of Object.values(
    //   borrowIncentivePoolsIndexer
    // )) {
    //   if (!borrowIncentiveCoinNames.includes(borrowIncentivePool.coinName))
    //     continue;
    //   borrowIncentivePool.coinPrice =
    //     coinPrices[borrowIncentivePool.coinName] ||
    //     borrowIncentivePool.coinPrice;
    //   borrowIncentivePool.rewardCoinPrice =
    //     coinPrices[rewardCoinName] || borrowIncentivePool.rewardCoinPrice;
    //   borrowIncentivePools[borrowIncentivePool.coinName] = borrowIncentivePool;
    // }
    // return borrowIncentivePools;
  }

  for (const pool of borrowIncentivePoolsQueryData.incentive_pools) {
    const borrowIncentivePoolPoints: OptionalKeys<
      Record<'sui' | 'sca', BorrowIncentivePoolPoints>
    > = {};
    const parsedBorrowIncentivePoolData =
      parseOriginBorrowIncentivePoolData(pool);

    const coinPrices = await query.utils.getCoinPrices(
      [
        ...new Set([
          ...borrowIncentiveCoinNames,
          ...SUPPORT_BORROW_INCENTIVE_REWARDS,
        ]),
      ] ?? []
    );

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
      const rewardCoinType = normalizeStructTag(poolPoint.pointType);
      const rewardCoinName =
        query.utils.parseCoinNameFromType<SupportBorrowIncentiveRewardCoins>(
          rewardCoinType
        );
      const rewardCoinPrice = coinPrices?.[rewardCoinName] ?? 0;
      const rewardCoinDecimal = query.utils.getCoinDecimal(rewardCoinName);

      const symbol = query.utils.parseSymbol(rewardCoinName);
      const coinDecimal = query.utils.getCoinDecimal(rewardCoinName);

      const calculatedPoolPoint = calculateBorrowIncentivePoolPointData(
        parsedBorrowIncentivePoolData,
        poolPoint,
        rewardCoinPrice,
        rewardCoinDecimal,
        poolCoinPrice,
        poolCoinDecimal
      );

      borrowIncentivePoolPoints[coinName as SupportBorrowIncentiveRewardCoins] =
        {
          symbol,
          coinName: rewardCoinName,
          coinType: rewardCoinType,
          coinDecimal,
          coinPrice: rewardCoinPrice,
          points: poolPoint.points,
          distributedPoint: poolPoint.distributedPoint,
          weightedAmount: poolPoint.weightedAmount,
          ...calculatedPoolPoint,
        };
    }

    borrowIncentivePools[poolCoinName] = {
      coinName: poolCoinName,
      symbol: query.utils.parseSymbol(poolCoinName),
      coinType: poolCoinType,
      coinDecimal: poolCoinDecimal,
      coinPrice: poolCoinPrice,
      points: borrowIncentivePoolPoints,
      staked: parsedBorrowIncentivePoolData.staked,
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
  query: ScallopQuery,
  obligationId: string,
  borrowIncentiveCoinNames?: SupportBorrowIncentiveCoins[]
) => {
  borrowIncentiveCoinNames = borrowIncentiveCoinNames || [
    ...SUPPORT_BORROW_INCENTIVE_POOLS,
  ];
  const queryPkgId = query.address.get('borrowIncentive.query');
  const incentiveAccountsId = query.address.get(
    'borrowIncentive.incentiveAccounts'
  );
  const queryTarget = `${queryPkgId}::incentive_account_query::incentive_account_data`;
  const args = [incentiveAccountsId, obligationId];

  const queryResult = await query.cache.queryInspectTxn({ queryTarget, args });
  const borrowIncentiveAccountsQueryData = queryResult.events[0]
    .parsedJson as BorrowIncentiveAccountsQueryInterface;

  const borrowIncentiveAccounts: BorrowIncentiveAccounts = Object.values(
    borrowIncentiveAccountsQueryData.pool_records
  ).reduce((accounts, accountData) => {
    const parsedBorrowIncentiveAccount =
      parseOriginBorrowIncentiveAccountData(accountData);
    const poolType = parsedBorrowIncentiveAccount.poolType;
    const coinName =
      query.utils.parseCoinNameFromType<SupportBorrowIncentiveCoins>(poolType);

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
  query: ScallopQuery,
  veScaKeyId: string
): Promise<string | null> => {
  const borrowIncentiveObjectId = query.address.get('borrowIncentive.object');
  const incentivePoolsId = query.address.get('borrowIncentive.incentivePools');
  const veScaPkgId = IS_VE_SCA_TEST
    ? '0xb220d034bdf335d77ae5bfbf6daf059c2cc7a1f719b12bfed75d1736fac038c8'
    : query.address.get('vesca.id');

  // get incentive pools
  const incentivePoolsResponse = await query.cache.queryGetObject(
    incentivePoolsId,
    {
      showContent: true,
    }
  );

  if (incentivePoolsResponse.data?.content?.dataType !== 'moveObject')
    return null;
  const incentivePoolFields = incentivePoolsResponse.data.content.fields as any;
  const veScaBindTableId = incentivePoolFields.ve_sca_bind.fields.id
    .id as string;

  // check if veSca is inside the bind table
  const keyType = `${borrowIncentiveObjectId}::typed_id::TypedID<${veScaPkgId}::ve_sca::VeScaKey>`;
  const veScaBindTableResponse = await query.cache.queryGetDynamicFieldObject({
    parentId: veScaBindTableId,
    name: {
      type: keyType,
      value: veScaKeyId,
    },
  });

  if (veScaBindTableResponse.data?.content?.dataType !== 'moveObject')
    return null;
  const veScaBindTableFields = veScaBindTableResponse.data.content
    .fields as any;
  // get obligationId pair
  const obligationId = veScaBindTableFields.value.fields.id as string;

  return obligationId;
};

export const getBindedVeScaKey = async (
  query: ScallopQuery,
  obliationId: string
): Promise<string | null> => {
  const borrowIncentiveObjectId = query.address.get('borrowIncentive.object');
  const incentiveAccountsId = query.address.get(
    'borrowIncentive.incentiveAccounts'
  );
  const corePkg = query.address.get('core.object');

  // get IncentiveAccounts object
  const incentiveAccountsObject = await query.cache.queryGetObject(
    incentiveAccountsId,
    {
      showContent: true,
    }
  );
  if (incentiveAccountsObject.data?.content?.dataType !== 'moveObject')
    return null;
  const incentiveAccountsTableId = (
    incentiveAccountsObject.data.content.fields as any
  ).accounts.fields.id.id;

  // Search in the table
  const bindedIncentiveAcc = await query.cache.queryGetDynamicFieldObject({
    parentId: incentiveAccountsTableId,
    name: {
      type: `${borrowIncentiveObjectId}::typed_id::TypedID<${corePkg}::obligation::Obligation>`,
      value: obliationId,
    },
  });

  if (bindedIncentiveAcc.data?.content?.dataType !== 'moveObject') return null;
  const bindedIncentiveAccFields = bindedIncentiveAcc.data.content
    .fields as any;

  return (
    bindedIncentiveAccFields.value.fields.binded_ve_sca_key?.fields.id ?? null
  );
};
