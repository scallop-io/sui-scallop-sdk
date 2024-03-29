import { normalizeStructTag } from '@mysten/sui.js/utils';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import {
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

  const txBlock = new SuiKitTxBlock();
  const queryTarget = `${queryPkgId}::incentive_pools_query::incentive_pools_data`;
  txBlock.moveCall(queryTarget, [incentivePoolsId]);
  const queryResult = await query.suiKit.inspectTxn(txBlock);
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

  const txBlock = new SuiKitTxBlock();
  txBlock.moveCall(queryTarget, [incentiveAccountsId, obligationId]);
  const queryResult = await query.suiKit.inspectTxn(txBlock);
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
