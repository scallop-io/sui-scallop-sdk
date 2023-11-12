import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { SUPPORT_BORROW_INCENTIVE_POOLS } from '../constants';
import {
  parseOriginBorrowIncentivePoolData,
  calculateBorrowIncentivePoolData,
  parseOriginBorrowIncentiveRewardPoolData,
  calculateBorrowIncentiveRewardPoolData,
  parseOriginBorrowIncentiveAccountData,
} from '../utils';
import type { ScallopQuery } from '../models';
import type {
  BorrowIncentivePoolsQueryInterface,
  BorrowIncentivePools,
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentiveAccounts,
  SupportBorrowIncentiveCoins,
  SupportAssetCoins,
} from '../types';

/**
 * Query borrow incentive pools data.
 *
 * @param query - The Scallop query instance.
 * @param borrowIncentiveCoinNames - Specific an array of support borrow incentive coin name.
 * @return Borrow incentive pools data.
 */
export const queryBorrowIncentivePools = async (
  query: ScallopQuery,
  borrowIncentiveCoinNames?: SupportBorrowIncentiveCoins[]
) => {
  borrowIncentiveCoinNames = borrowIncentiveCoinNames || [
    ...SUPPORT_BORROW_INCENTIVE_POOLS,
  ];
  const queryPkgId = query.address.get('borrowIncentive.query');
  const incentivePoolsId = query.address.get('borrowIncentive.incentivePools');
  const txBlock = new SuiKitTxBlock();
  const queryTarget = `${queryPkgId}::incentive_pools_query::incentive_pools_data`;
  // The reward coin type currently only support sui, so bring it in directly here.
  txBlock.moveCall(queryTarget, [incentivePoolsId], ['0x2::sui::SUI']);
  const queryResult = await query.suiKit.inspectTxn(txBlock);
  const borrowIncentivePoolsQueryData = queryResult.events[0]
    .parsedJson as BorrowIncentivePoolsQueryInterface;

  const parsedBorrowIncentiveRewardPoolData =
    parseOriginBorrowIncentiveRewardPoolData(
      borrowIncentivePoolsQueryData.reward_pool
    );
  const rewardCoinType = parsedBorrowIncentiveRewardPoolData.rewardType;

  const borrowIncentivePools: BorrowIncentivePools = {};
  for (const pool of borrowIncentivePoolsQueryData.incentive_pools) {
    const coinType = '0x' + pool.pool_type.name;
    const coinName =
      query.utils.parseCoinNameFromType<SupportBorrowIncentiveCoins>(coinType);
    const rewardCoinName =
      query.utils.parseCoinNameFromType<SupportAssetCoins>(rewardCoinType);

    // Filter pools not yet supported by the SDK.
    if (!borrowIncentiveCoinNames.includes(coinName)) {
      continue;
    }

    const coinPrices = await query.utils.getCoinPrices([
      coinName,
      rewardCoinName,
    ]);

    const parsedBorrowIncentivePoolData =
      parseOriginBorrowIncentivePoolData(pool);

    const coinPrice = coinPrices?.[coinName] ?? 0;
    const coinDecimal = query.utils.getCoinDecimal(coinName);
    const calculatedBorrowIncentivePoolData = calculateBorrowIncentivePoolData(
      parsedBorrowIncentivePoolData,
      coinPrice,
      coinDecimal
    );

    const rewardCoinPrice = coinPrices?.[rewardCoinName] ?? 0;
    const rewardCoinDecimal = query.utils.getCoinDecimal(rewardCoinName);
    const calculatedBorrowIncentiveRewardPoolData =
      calculateBorrowIncentiveRewardPoolData(
        parsedBorrowIncentivePoolData,
        parsedBorrowIncentiveRewardPoolData,
        calculatedBorrowIncentivePoolData,
        rewardCoinPrice,
        rewardCoinDecimal
      );

    borrowIncentivePools[coinName] = {
      coinName: coinName,
      symbol: query.utils.parseSymbol(coinName),
      coinType: coinType,
      rewardCoinType: rewardCoinType,
      coinDecimal: coinDecimal,
      rewardCoinDecimal: rewardCoinDecimal,
      coinPrice: coinPrice,
      rewardCoinPrice: rewardCoinPrice,
      maxPoint: parsedBorrowIncentivePoolData.maxPoint,
      distributedPoint: parsedBorrowIncentivePoolData.distributedPoint,
      maxStake: parsedBorrowIncentivePoolData.maxStake,
      ...calculatedBorrowIncentivePoolData,
      exchangeRateNumerator:
        parsedBorrowIncentiveRewardPoolData.exchangeRateNumerator,
      exchangeRateDenominator:
        parsedBorrowIncentiveRewardPoolData.exchangeRateDenominator,
      ...calculatedBorrowIncentiveRewardPoolData,
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
    borrowIncentiveAccountsQueryData.incentive_states
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
      accounts[coinName] = {
        poolType: poolType,
        amount: parsedBorrowIncentiveAccount.amount,
        points: parsedBorrowIncentiveAccount.points,
        totalPoints: parsedBorrowIncentiveAccount.totalPoints,
        index: parsedBorrowIncentiveAccount.index,
      };
    }

    return accounts;
  }, {} as BorrowIncentiveAccounts);

  return borrowIncentiveAccounts;
};
