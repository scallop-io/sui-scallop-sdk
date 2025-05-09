import BigNumber from 'bignumber.js';
import { minBigNumber, estimatedFactor } from 'src/utils';
import type { ScallopQuery } from 'src/models';
import type {
  Market,
  MarketPool,
  Spool,
  StakeAccount,
  Lendings,
  Lending,
  ObligationAccounts,
  ObligationAccount,
  CoinAmounts,
  CoinPrices,
  TotalValueLocked,
  ObligationBorrowIncentiveReward,
  MarketPools,
  MarketCollaterals,
} from 'src/types';
import { SuiObjectRef } from '@mysten/sui/client';
import { normalizeStructTag, SUI_TYPE_ARG } from '@scallop-io/sui-kit';

/**
 * Get user lending infomation for specific pools.
 *
 * @param query - The ScallopQuery instance.
 * @param poolCoinNames - Specific an array of support pool coin name.
 * @param ownerAddress - The owner address.
 * @param indexer - Whether to use indexer.
 * @return User lending infomation for specific pools.
 */
export const getLendings = async (
  query: ScallopQuery,
  poolCoinNames: string[] = [...query.constants.whitelist.lending],
  ownerAddress?: string,
  marketPools?: MarketPools,
  coinPrices?: CoinPrices,
  indexer: boolean = false
) => {
  const marketCoinNames = poolCoinNames.map((poolCoinName) =>
    query.utils.parseMarketCoinName(poolCoinName)
  );
  const stakeMarketCoinNames = marketCoinNames.filter((marketCoinName) =>
    query.constants.whitelist.spool.has(marketCoinName)
  ) as string[];

  coinPrices = coinPrices ?? (await query.utils.getCoinPrices());
  marketPools =
    marketPools ??
    (
      await query.getMarketPools(poolCoinNames, {
        indexer,
        coinPrices,
      })
    ).pools;

  const spools = await query.getSpools(stakeMarketCoinNames, {
    indexer,
    marketPools,
    coinPrices,
  });
  const [coinAmounts, marketCoinAmounts, allStakeAccounts] = await Promise.all([
    query.getCoinAmounts(poolCoinNames, ownerAddress),
    query.getMarketCoinAmounts(marketCoinNames, ownerAddress),
    query.getAllStakeAccounts(ownerAddress),
  ]);

  const lendings: Lendings = {};

  await Promise.allSettled(
    poolCoinNames.map(async (poolCoinName) => {
      const stakeMarketCoinName = stakeMarketCoinNames.find(
        (marketCoinName) =>
          marketCoinName === query.utils.parseMarketCoinName(poolCoinName)
      );
      const marketCoinName = query.utils.parseMarketCoinName(poolCoinName);
      lendings[poolCoinName] = await getLending(
        query,
        poolCoinName,
        ownerAddress,
        indexer,
        marketPools?.[poolCoinName],
        stakeMarketCoinName ? spools[stakeMarketCoinName] : undefined,
        stakeMarketCoinName ? allStakeAccounts[stakeMarketCoinName] : [],
        coinAmounts?.[poolCoinName],
        marketCoinAmounts?.[marketCoinName],
        coinPrices?.[poolCoinName] ?? 0
      );
    })
  );

  return lendings;
};

/**
 * Get user lending infomation for specific pool.
 *
 * @description
 * The lending information includes the spool information extended by it.
 *
 * @param query - The ScallopQuery instance.
 * @param poolCoinName - Specific support coin name.
 * @param ownerAddress - The owner address.
 * @param indexer - Whether to use indexer.
 * @param marketPool - The market pool data.
 * @param spool - The spool data.
 * @param stakeAccounts - The stake accounts data.
 * @param coinAmount - The coin amount.
 * @param marketCoinAmount - The market coin amount.
 * @return User lending infomation for specific pool.
 */
export const getLending = async (
  query: ScallopQuery,
  poolCoinName: string,
  ownerAddress?: string,
  indexer: boolean = false,
  marketPool?: MarketPool,
  spool?: Spool,
  stakeAccounts?: StakeAccount[],
  coinAmount?: number,
  marketCoinAmount?: number,
  coinPrice?: number,
  sCoinAmount?: number
) => {
  const marketCoinName = query.utils.parseMarketCoinName(poolCoinName);
  coinPrice =
    coinPrice ?? (await query.utils.getCoinPrices())?.[poolCoinName] ?? 0;

  marketPool =
    marketPool ??
    (await query.getMarketPool(poolCoinName, {
      indexer,
      coinPrice,
    }));

  if (!marketPool)
    throw new Error(`Failed to fetch marketPool for ${poolCoinName}`);

  spool =
    (spool ?? query.constants.whitelist.spool.has(marketCoinName))
      ? await query.getSpool(marketCoinName as string, {
          indexer,
          marketPool,
          coinPrices: {
            [poolCoinName]: coinPrice,
          },
        })
      : undefined;

  stakeAccounts =
    stakeAccounts || query.constants.whitelist.spool.has(marketCoinName)
      ? await query.getStakeAccounts(marketCoinName as string, ownerAddress)
      : [];
  coinAmount =
    coinAmount || (await query.getCoinAmount(poolCoinName, ownerAddress));
  marketCoinAmount =
    marketCoinAmount ||
    (await query.getMarketCoinAmount(marketCoinName, ownerAddress));
  sCoinAmount =
    sCoinAmount || (await query.getSCoinAmount(marketCoinName, ownerAddress));
  const coinDecimal = query.utils.getCoinDecimal(poolCoinName);

  // Handle staked scoin
  let stakedMarketAmount = BigNumber(0);
  let stakedMarketCoin = BigNumber(0);
  let stakedAmount = BigNumber(0);
  let stakedCoin = BigNumber(0);
  let stakedValue = BigNumber(0);
  let availableUnstakeAmount = BigNumber(0);
  let availableUnstakeCoin = BigNumber(0);
  let availableClaimAmount = BigNumber(0);
  let availableClaimCoin = BigNumber(0);

  if (spool) {
    for (const stakeAccount of stakeAccounts) {
      const accountStakedMarketCoinAmount = BigNumber(stakeAccount.staked);
      const accountStakedMarketCoin = accountStakedMarketCoinAmount.shiftedBy(
        -1 * spool.coinDecimal
      );
      const accountStakedAmount = accountStakedMarketCoinAmount.multipliedBy(
        marketPool?.conversionRate ?? 1
      );
      const accountStakedCoin = accountStakedAmount.shiftedBy(
        -1 * spool.coinDecimal
      );
      const accountStakedValue = accountStakedCoin.multipliedBy(
        spool.coinPrice
      );

      stakedMarketAmount = stakedMarketAmount.plus(
        accountStakedMarketCoinAmount
      );
      stakedMarketCoin = stakedMarketCoin.plus(accountStakedMarketCoin);
      stakedAmount = stakedAmount.plus(accountStakedAmount);
      stakedCoin = stakedCoin.plus(accountStakedCoin);
      stakedValue = stakedValue.plus(accountStakedValue);
      availableUnstakeAmount = availableUnstakeAmount.plus(
        accountStakedMarketCoinAmount
      );
      availableUnstakeCoin = availableUnstakeAmount.shiftedBy(
        -1 * spool.coinDecimal
      );

      const baseIndexRate = 1_000_000_000;
      const increasedPointRate = spool.currentPointIndex
        ? BigNumber(spool.currentPointIndex - stakeAccount.index).dividedBy(
            baseIndexRate
          )
        : 1;
      availableClaimAmount = availableClaimAmount.plus(
        accountStakedMarketCoinAmount
          .multipliedBy(increasedPointRate)
          .plus(stakeAccount.points)
          .multipliedBy(spool.exchangeRateNumerator)
          .dividedBy(spool.exchangeRateDenominator)
      );
      availableClaimCoin = availableClaimAmount.shiftedBy(
        -1 * spool.rewardCoinDecimal
      );
    }
  }

  // Handle supplied coin
  const suppliedAmount = BigNumber(marketCoinAmount)
    .plus(BigNumber(sCoinAmount))
    .multipliedBy(marketPool?.conversionRate ?? 1);
  const suppliedCoin = suppliedAmount.shiftedBy(-1 * coinDecimal);
  const suppliedValue = suppliedCoin.multipliedBy(coinPrice ?? 0);

  const marketCoinPrice = BigNumber(coinPrice ?? 0).multipliedBy(
    marketPool?.conversionRate ?? 1
  );
  const unstakedMarketAmount = BigNumber(marketCoinAmount).plus(
    BigNumber(sCoinAmount)
  );
  const unstakedMarketCoin = unstakedMarketAmount.shiftedBy(-1 * coinDecimal);

  const availableSupplyAmount = BigNumber(coinAmount);
  const availableSupplyCoin = availableSupplyAmount.shiftedBy(-1 * coinDecimal);
  const availableWithdrawAmount = minBigNumber(
    suppliedAmount,
    marketPool?.supplyAmount ?? Infinity
  ).plus(stakedAmount);
  const availableWithdrawCoin = minBigNumber(
    suppliedCoin,
    marketPool?.supplyCoin ?? Infinity
  ).plus(stakedCoin);

  const lending: Lending = {
    coinName: poolCoinName,
    symbol: query.utils.parseSymbol(poolCoinName),
    coinType: query.utils.parseCoinType(poolCoinName),
    marketCoinType: query.utils.parseMarketCoinType(poolCoinName),
    sCoinType: marketPool?.sCoinType ?? '',
    coinDecimal: coinDecimal,
    coinPrice: coinPrice ?? 0,
    conversionRate: marketPool?.conversionRate ?? 1,
    marketCoinPrice: marketCoinPrice.toNumber(),
    supplyApr: marketPool?.supplyApr ?? 0,
    supplyApy: marketPool?.supplyApy ?? 0,
    rewardApr: spool?.rewardApr ?? 0,
    suppliedAmount: suppliedAmount.plus(stakedAmount).toNumber(),
    suppliedCoin: suppliedCoin.plus(stakedCoin).toNumber(),
    suppliedValue: suppliedValue.plus(stakedValue).toNumber(),
    stakedMarketAmount: stakedMarketAmount.toNumber(),
    stakedMarketCoin: stakedMarketCoin.toNumber(),
    stakedAmount: stakedAmount.toNumber(),
    stakedCoin: stakedCoin.toNumber(),
    stakedValue: stakedValue.toNumber(),
    unstakedMarketAmount: unstakedMarketAmount.toNumber(),
    unstakedMarketCoin: unstakedMarketCoin.toNumber(),
    unstakedAmount: suppliedAmount.toNumber(),
    unstakedCoin: suppliedCoin.toNumber(),
    unstakedValue: suppliedValue.toNumber(),
    availableSupplyAmount: availableSupplyAmount.toNumber(),
    availableSupplyCoin: availableSupplyCoin.toNumber(),
    availableWithdrawAmount: availableWithdrawAmount.toNumber(),
    availableWithdrawCoin: availableWithdrawCoin.toNumber(),
    availableStakeAmount: unstakedMarketAmount.toNumber(),
    availableStakeCoin: unstakedMarketCoin.toNumber(),
    availableUnstakeAmount: availableUnstakeAmount.toNumber(),
    availableUnstakeCoin: availableUnstakeCoin.toNumber(),
    availableClaimAmount: availableClaimAmount.toNumber(),
    availableClaimCoin: availableClaimCoin.toNumber(),
    isIsolated: marketPool ? marketPool.isIsolated : false,
  };

  return lending;
};

/**
 * Get all obligation accounts data.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @param indexer - Whether to use indexer.
 * @return All obligation accounts data.
 */
export const getObligationAccounts = async (
  query: ScallopQuery,
  ownerAddress?: string,
  market?: {
    pools: MarketPools;
    collaterals: MarketCollaterals;
  },
  coinPrices?: CoinPrices,
  indexer: boolean = false
) => {
  market = market ?? (await query.getMarketPools(undefined, { indexer }));
  coinPrices =
    coinPrices ??
    (await query.getAllCoinPrices({
      marketPools: market.pools,
    }));
  const [coinAmounts, obligations] = await Promise.all([
    query.getCoinAmounts(undefined, ownerAddress),
    query.getObligations(ownerAddress),
  ]);

  const obligationObjects = await query.scallopSuiKit.queryGetObjects(
    obligations.map((obligation) => obligation.id)
  );
  const obligationAccounts: ObligationAccounts = {};
  await Promise.allSettled(
    obligations.map(async (obligation, idx) => {
      obligationAccounts[obligation.keyId] = await getObligationAccount(
        query,
        obligationObjects[idx] ?? obligation.id,
        ownerAddress,
        indexer,
        market,
        coinPrices,
        coinAmounts
      );
    })
  );

  return obligationAccounts;
};

/**
 * Get obligation account data.
 *
 * @param query - The Scallop query instance.
 * @param obligation - The obligation id.
 * @param indexer - Whether to use indexer.
 * @return Obligation account data.
 */
export const getObligationAccount = async (
  query: ScallopQuery,
  obligation: string | SuiObjectRef,
  ownerAddress?: string,
  indexer: boolean = false,
  market?: Market,
  coinPrices?: CoinPrices,
  coinAmounts?: CoinAmounts
) => {
  market = market ?? (await query.getMarketPools(undefined, { indexer }));
  coinPrices =
    coinPrices ?? (await query.getAllCoinPrices({ marketPools: market.pools }));
  coinAmounts =
    coinAmounts ??
    (await query.getCoinAmounts(
      Array.from(query.constants.whitelist.lending),
      ownerAddress
    ));

  const [obligationQuery, borrowIncentivePools, borrowIncentiveAccounts] =
    await Promise.all([
      query.queryObligation(obligation),
      query.getBorrowIncentivePools(undefined, {
        coinPrices,
        marketPools: market.pools,
      }),
      query.getBorrowIncentiveAccounts(obligation),
    ]);

  const collaterals: ObligationAccount['collaterals'] = {};
  const debts: ObligationAccount['debts'] = {};
  const borrowIncentives: ObligationAccount['borrowIncentives'] = {};
  let totalDepositedPools = 0;
  let totalDepositedValue = BigNumber(0);
  let totalBorrowCapacityValue = BigNumber(0);
  let totalRequiredCollateralValue = BigNumber(0);
  let totalBorrowedPools = 0;
  let totalRewardedPools = 0;
  let totalBorrowedValue = BigNumber(0);
  let totalBorrowedValueWithWeight = BigNumber(0);

  for (const assetCoinName of Array.from(
    query.constants.whitelist.collateral
  )) {
    const collateral = obligationQuery?.collaterals.find((collateral) => {
      const collateralCoinName = query.utils.parseCoinNameFromType(
        collateral.type.name
      );
      return assetCoinName === collateralCoinName;
    });

    const marketCollateral = market.collaterals[assetCoinName];
    const coinDecimal = query.utils.getCoinDecimal(assetCoinName);
    const coinPrice = coinPrices?.[assetCoinName];
    const coinAmount = coinAmounts?.[assetCoinName] ?? 0;

    if (marketCollateral && coinPrice) {
      const depositedAmount = BigNumber(collateral?.amount ?? 0);
      const depositedCoin = depositedAmount.shiftedBy(-1 * coinDecimal);
      const depositedValue = depositedCoin.multipliedBy(coinPrice);
      const borrowCapacityValue = depositedValue.multipliedBy(
        marketCollateral.collateralFactor
      );
      const requiredCollateralValue = depositedValue.multipliedBy(
        marketCollateral.liquidationFactor
      );

      // const poolSizeAmount = BigNumber(marketCollateral.maxDepositAmount).minus(
      //   marketCollateral.depositAmount
      // );

      const availableDepositAmount = BigNumber(coinAmount);
      const availableDepositCoin = availableDepositAmount.shiftedBy(
        -1 * coinDecimal
      );

      totalDepositedValue = totalDepositedValue.plus(depositedValue);
      totalBorrowCapacityValue =
        totalBorrowCapacityValue.plus(borrowCapacityValue);
      totalRequiredCollateralValue = totalRequiredCollateralValue.plus(
        requiredCollateralValue
      );

      if (depositedAmount.isGreaterThan(0)) {
        totalDepositedPools++;
      }

      collaterals[assetCoinName] = {
        coinName: assetCoinName,
        coinType: query.utils.parseCoinType(assetCoinName),
        symbol: query.utils.parseSymbol(assetCoinName),
        coinDecimal: coinDecimal,
        coinPrice: coinPrice,
        depositedAmount: depositedAmount.toNumber(),
        depositedCoin: depositedCoin.toNumber(),
        depositedValue: depositedValue.toNumber(),
        borrowCapacityValue: borrowCapacityValue.toNumber(),
        requiredCollateralValue: requiredCollateralValue.toNumber(),
        availableDepositAmount: availableDepositAmount.toNumber(),
        availableDepositCoin: availableDepositCoin.toNumber(),
        availableWithdrawAmount: 0,
        availableWithdrawCoin: 0,
      };
    }
  }

  const borrowAssetCoinNames: string[] = [
    ...new Set([
      ...Object.values(market.pools)
        .filter((t) => !!t)
        .map((pool) => pool.coinName),
    ]),
  ];

  for (const assetCoinName of borrowAssetCoinNames) {
    const debt = obligationQuery?.debts.find((debt) => {
      const poolCoinName = query.utils.parseCoinNameFromType(debt.type.name);
      return assetCoinName === poolCoinName;
    });

    const marketPool = market.pools[assetCoinName];
    const coinDecimal = query.utils.getCoinDecimal(assetCoinName);
    const coinPrice = coinPrices?.[assetCoinName];
    const coinAmount = coinAmounts?.[assetCoinName] ?? 0;

    if (marketPool && coinPrice) {
      const increasedRate = debt?.borrowIndex
        ? marketPool.borrowIndex / Number(debt.borrowIndex) - 1
        : 0;
      const borrowedAmount = BigNumber(debt?.amount ?? 0).multipliedBy(
        increasedRate + 1
      );
      const borrowedCoin = borrowedAmount.shiftedBy(-1 * coinDecimal);

      const requiredRepayAmount = borrowedAmount;
      const requiredRepayCoin = requiredRepayAmount.shiftedBy(-1 * coinDecimal);

      const availableRepayAmount = BigNumber(coinAmount);
      const availableRepayCoin = availableRepayAmount.shiftedBy(
        -1 * coinDecimal
      );

      const borrowedValue = requiredRepayCoin.multipliedBy(coinPrice);
      const borrowedValueWithWeight = borrowedValue.multipliedBy(
        marketPool.borrowWeight
      );

      totalBorrowedValue = totalBorrowedValue.plus(borrowedValue);
      totalBorrowedValueWithWeight = totalBorrowedValueWithWeight.plus(
        borrowedValueWithWeight
      );

      if (borrowedAmount.isGreaterThan(0)) {
        totalBorrowedPools++;
      }

      debts[assetCoinName] = {
        coinName: assetCoinName,
        coinType: query.utils.parseCoinType(assetCoinName),
        symbol: query.utils.parseSymbol(assetCoinName),
        coinDecimal: coinDecimal,
        coinPrice: coinPrice,
        borrowedAmount: borrowedAmount.toNumber(),
        borrowedCoin: borrowedCoin.toNumber(),
        borrowedValue: borrowedValue.toNumber(),
        borrowedValueWithWeight: borrowedValueWithWeight.toNumber(),
        borrowIndex: Number(debt?.borrowIndex ?? 0),
        requiredRepayAmount: requiredRepayAmount.toNumber(),
        requiredRepayCoin: requiredRepayCoin.toNumber(),
        availableBorrowAmount: 0,
        availableBorrowCoin: 0,
        availableRepayAmount: availableRepayAmount.toNumber(),
        availableRepayCoin: availableRepayCoin.toNumber(),
      };
    }
  }

  for (const [poolCoinName, borrowIncentiveAccount] of Object.entries(
    borrowIncentiveAccounts
  )) {
    if (!borrowIncentiveAccount) continue;

    const coinName = poolCoinName as string;
    const borrowIncentivePool = borrowIncentivePools[coinName];
    if (borrowIncentivePool) {
      const rewards: ObligationBorrowIncentiveReward[] = [];
      Object.entries(borrowIncentiveAccount.pointList).forEach(
        ([key, accountPoint]) => {
          const poolPoint =
            borrowIncentivePool.points[
              query.utils.parseSCoinTypeNameToMarketCoinName(key)
            ];
          if (accountPoint && poolPoint) {
            let availableClaimAmount = BigNumber(0);
            let availableClaimCoin = BigNumber(0);
            const accountBorrowedAmount = BigNumber(
              accountPoint.weightedAmount
            );
            const baseIndexRate = 1_000_000_000;
            const increasedPointRate = poolPoint.currentPointIndex
              ? Math.max(
                  BigNumber(poolPoint.currentPointIndex - accountPoint.index)
                    .dividedBy(baseIndexRate)
                    .toNumber(),
                  0
                )
              : 1;
            availableClaimAmount = availableClaimAmount.plus(
              accountBorrowedAmount
                .multipliedBy(increasedPointRate)
                .plus(accountPoint.points)
            );
            availableClaimCoin = availableClaimAmount.shiftedBy(
              -1 * poolPoint.coinDecimal
            );

            // for veSCA
            const weightScale = BigNumber(1_000_000_000_000);
            const boostValue = BigNumber(accountPoint.weightedAmount)
              .div(
                BigNumber(borrowIncentiveAccount.debtAmount)
                  .multipliedBy(poolPoint.baseWeight)
                  .dividedBy(weightScale)
              )
              .isFinite()
              ? BigNumber(accountPoint.weightedAmount)
                  .div(
                    BigNumber(borrowIncentiveAccount.debtAmount)
                      .multipliedBy(poolPoint.baseWeight)
                      .dividedBy(weightScale)
                  )
                  .toNumber()
              : 1;

            if (availableClaimAmount.isGreaterThanOrEqualTo(0)) {
              rewards.push({
                coinName: poolPoint.coinName,
                coinType: poolPoint.coinType,
                symbol: poolPoint.symbol,
                coinDecimal: poolPoint.coinDecimal,
                coinPrice: poolPoint.coinPrice,
                weightedBorrowAmount: accountBorrowedAmount.toNumber(),
                availableClaimAmount: availableClaimAmount.toNumber(),
                availableClaimCoin: availableClaimCoin.toNumber(),
                boostValue,
              });
            }
          }
        }
      );

      if (
        Object.keys(borrowIncentivePool.points).some((coinName: any) => {
          const rewardApr =
            borrowIncentivePool.points[coinName as string]?.rewardApr;
          return (
            rewardApr !== Infinity &&
            typeof rewardApr == 'number' &&
            rewardApr > 0
          );
        }) &&
        borrowIncentiveAccount.debtAmount > 0
      ) {
        totalRewardedPools++;
      }
      borrowIncentives[coinName] = {
        coinName: borrowIncentivePool.coinName,
        coinType: borrowIncentivePool.coinType,
        symbol: borrowIncentivePool.symbol,
        coinDecimal: borrowIncentivePool.coinDecimal,
        coinPrice: borrowIncentivePool.coinPrice,
        rewards,
      };
    }
  }

  let riskLevel = totalRequiredCollateralValue.isZero()
    ? // Note: when there is no collateral and debt is not zero, then it's a bad-debt situation.
      totalBorrowedValueWithWeight.isGreaterThan(0)
      ? BigNumber(100)
      : BigNumber(0)
    : totalBorrowedValueWithWeight.dividedBy(totalRequiredCollateralValue);
  // Note: 100% represents the safety upper limit. Even if it exceeds 100% before it is liquidated, it will only display 100%.
  riskLevel = riskLevel.isLessThan(1) ? riskLevel : BigNumber(1);

  const accountBalanceValue = totalDepositedValue
    .minus(totalBorrowedValue)
    .isGreaterThan(0)
    ? totalDepositedValue.minus(totalBorrowedValue)
    : BigNumber(0);
  const availableCollateralValue = totalBorrowCapacityValue
    .minus(totalBorrowedValueWithWeight)
    .isGreaterThan(0)
    ? totalBorrowCapacityValue.minus(totalBorrowedValueWithWeight)
    : BigNumber(0);
  const requiredCollateralValue = totalBorrowedValueWithWeight.isGreaterThan(0)
    ? totalRequiredCollateralValue
    : BigNumber(0);
  const unhealthyCollateralValue = totalBorrowedValueWithWeight
    .minus(requiredCollateralValue)
    .isGreaterThan(0)
    ? totalBorrowedValueWithWeight.minus(requiredCollateralValue)
    : BigNumber(0);

  const obligationAccount: ObligationAccount = {
    obligationId:
      typeof obligation === 'string' ? obligation : obligation.objectId,
    // Deposited collateral value (collateral balance)
    totalDepositedValue: totalDepositedValue.toNumber(),
    // Borrowed debt value (liabilities balance)
    totalBorrowedValue: totalBorrowedValue.toNumber(),
    // The difference between the user’s actual deposit and loan (remaining balance)
    totalBalanceValue: accountBalanceValue.toNumber(),
    // Effective collateral value (the actual collateral value included in the calculation).
    totalBorrowCapacityValue: totalBorrowCapacityValue.toNumber(),
    // Available collateral value (the remaining collateral value that can be borrowed).
    totalAvailableCollateralValue: availableCollateralValue.toNumber(),
    // Available debt value (the actual borrowing value included in the calculation).
    totalBorrowedValueWithWeight: totalBorrowedValueWithWeight.toNumber(),
    // Required collateral value (avoid be liquidated).
    totalRequiredCollateralValue: requiredCollateralValue.toNumber(),
    // Unliquidated collateral value (pending liquidation).
    totalUnhealthyCollateralValue: unhealthyCollateralValue.toNumber(),
    totalRiskLevel: riskLevel.toNumber(),
    totalDepositedPools,
    totalBorrowedPools,
    totalRewardedPools,
    collaterals,
    debts,
    borrowIncentives,
  };

  for (const [collateralCoinName, obligationCollateral] of Object.entries(
    obligationAccount.collaterals
  )) {
    if (!obligationCollateral) continue;
    const marketCollateral = market.collaterals[collateralCoinName as string];
    if (marketCollateral) {
      let estimatedAvailableWithdrawAmount = BigNumber(
        obligationAccount.totalAvailableCollateralValue
      )
        .dividedBy(marketCollateral.collateralFactor)
        .dividedBy(marketCollateral.coinPrice)
        .shiftedBy(marketCollateral.coinDecimal);
      estimatedAvailableWithdrawAmount =
        obligationAccount.totalBorrowedValueWithWeight === 0
          ? // Note: when there is no debt record, there is no need to estimate and the deposited amount is directly used as available withdraw.
            BigNumber(obligationCollateral.depositedAmount)
          : minBigNumber(
              estimatedAvailableWithdrawAmount
                // Note: reduced chance of failure when calculations are inaccurate
                .multipliedBy(
                  estimatedFactor(
                    BigNumber(obligationAccount.totalAvailableCollateralValue)
                      .dividedBy(marketCollateral.collateralFactor)
                      .toNumber(),
                    3,
                    'increase'
                  )
                )
                .toNumber(),
              obligationCollateral.depositedAmount,
              marketCollateral.depositAmount
            );
      obligationCollateral.availableWithdrawAmount =
        estimatedAvailableWithdrawAmount.toNumber();
      obligationCollateral.availableWithdrawCoin =
        estimatedAvailableWithdrawAmount
          .shiftedBy(-1 * obligationCollateral.coinDecimal)
          .toNumber();
    }
  }
  for (const [poolCoinName, obligationDebt] of Object.entries(
    obligationAccount.debts
  )) {
    if (!obligationDebt) continue;
    const marketPool = market.pools[poolCoinName as string];
    if (marketPool) {
      const estimatedRequiredRepayAmount = BigNumber(
        obligationDebt.requiredRepayAmount
      )
        // Note: reduced chance of not being able to repay in full when calculations are inaccurate,
        // and the contract will not actually take the excess amount.
        .multipliedBy(
          estimatedFactor(obligationDebt.borrowedValue, 3, 'decrease')
        );

      let estimatedAvailableBorrowAmount = BigNumber(
        obligationAccount.totalAvailableCollateralValue
      )
        .dividedBy(marketPool.borrowWeight)
        .shiftedBy(marketPool.coinDecimal)
        .dividedBy(marketPool.coinPrice);
      estimatedAvailableBorrowAmount =
        obligationAccount.totalAvailableCollateralValue !== 0 &&
        BigNumber(marketPool.maxBorrowCoin).isGreaterThan(marketPool.borrowCoin)
          ? minBigNumber(
              estimatedAvailableBorrowAmount
                // Note: reduced chance of failure when calculations are inaccurate
                .multipliedBy(
                  estimatedFactor(
                    estimatedAvailableBorrowAmount
                      .shiftedBy(-1 * marketPool.coinDecimal)
                      .multipliedBy(marketPool.coinPrice)
                      .toNumber(),
                    3,
                    'increase'
                  )
                )
                .toNumber(),
              marketPool.supplyAmount
            )
          : BigNumber(0);

      obligationDebt.availableBorrowAmount =
        estimatedAvailableBorrowAmount.toNumber();
      obligationDebt.availableBorrowCoin = estimatedAvailableBorrowAmount
        .shiftedBy(-1 * obligationDebt.coinDecimal)
        .toNumber();
      obligationDebt.requiredRepayAmount =
        estimatedRequiredRepayAmount.toNumber();
      obligationDebt.requiredRepayCoin = estimatedRequiredRepayAmount
        .shiftedBy(-1 * obligationDebt.coinDecimal)
        .toNumber();
    }
  }

  return obligationAccount;
};

/**
 * Get total value locked data.
 *
 * @param query - The Scallop query instance.
 * @param indexer - Whether to use indexer.
 * @return Total value locked data.
 */
export const getTotalValueLocked = async (
  query: ScallopQuery,
  indexer: boolean = false
) => {
  const market = await query.getMarketPools(undefined, { indexer });

  let supplyLendingValue = BigNumber(0);
  let supplyCollateralValue = BigNumber(0);
  let borrowValue = BigNumber(0);

  if (indexer) {
    const tvlIndexer = await query.indexer.getTotalValueLocked();
    const tvl: TotalValueLocked = {
      supplyValue: tvlIndexer.supplyValue,
      supplyValueChangeRatio: tvlIndexer.supplyValueChangeRatio,
      borrowValue: tvlIndexer.borrowValue,
      borrowValueChangeRatio: tvlIndexer.borrowValueChangeRatio,
      totalValue: tvlIndexer.totalValue,
      totalValueChangeRatio: tvlIndexer.totalValueChangeRatio,
      supplyLendingValue: tvlIndexer.supplyLendingValue,
      supplyLendingValueChangeRatio: tvlIndexer.supplyLendingValueChangeRatio,
      supplyCollateralValue: tvlIndexer.supplyCollateralValue,
      supplyCollateralValueChangeRatio:
        tvlIndexer.supplyCollateralValueChangeRatio,
    };
    return tvl;
  }

  for (const pool of Object.values(market.pools)) {
    if (!pool) continue;
    supplyLendingValue = supplyLendingValue.plus(
      BigNumber(pool.supplyCoin).multipliedBy(pool.coinPrice)
    );
    borrowValue = borrowValue.plus(
      BigNumber(pool.borrowCoin).multipliedBy(pool.coinPrice)
    );
  }

  for (const collateral of Object.values(market.collaterals)) {
    if (!collateral) continue;
    supplyCollateralValue = supplyCollateralValue.plus(
      BigNumber(collateral.depositCoin).multipliedBy(collateral.coinPrice)
    );
  }

  const tvl: TotalValueLocked = {
    supplyValue: supplyLendingValue.plus(supplyCollateralValue).toNumber(),
    supplyLendingValue: supplyLendingValue.toNumber(),
    supplyCollateralValue: supplyCollateralValue.toNumber(),
    borrowValue: borrowValue.toNumber(),
    totalValue: supplyLendingValue
      .plus(supplyCollateralValue)
      .minus(borrowValue)
      .toNumber(),
  };

  return tvl;
};

/**
 * Get user portfolio by wallet address
 */
export const getUserPortfolio = async (
  query: ScallopQuery,
  walletAddress: string,
  indexer: boolean = false
) => {
  const coinPrices = await query.getAllCoinPrices({ indexer });
  const market = await query.getMarketPools(undefined, { indexer, coinPrices });

  const [lendings, obligationAccounts, borrowIncentivePools, veScas] =
    await Promise.all([
      query.getLendings(undefined, walletAddress, {
        indexer,
        marketPools: market.pools,
        coinPrices,
      }),
      query.getObligationAccounts(walletAddress, {
        indexer,
        market: market,
        coinPrices,
      }),
      query.getBorrowIncentivePools(undefined, {
        marketPools: market.pools,
        coinPrices,
      }),
      query.getVeScas({ walletAddress, excludeEmpty: true }),
    ]);

  // get pending rewards (spool and borrow incentive)
  const parsedLendings = Object.values(lendings)
    .filter(
      (t): t is NonNullable<typeof t> => !!t && t.availableWithdrawCoin > 0
    )
    .map((lending) => ({
      suppliedCoin: lending.availableWithdrawCoin,
      suppliedValue: lending.suppliedValue,
      stakedCoin: lending.availableUnstakeCoin,
      coinName: lending.coinName,
      symbol: lending.symbol,
      coinType: lending.coinType,
      coinPrice: lending.coinPrice,
      coinDecimals: lending.coinDecimal,
      supplyApr: lending.supplyApr,
      supplyApy: lending.supplyApy,
      incentiveApr: isFinite(lending.rewardApr) ? lending.rewardApr : 0,
    }));

  const parsedObligationAccounts = Object.values(obligationAccounts)
    .filter(
      (t): t is NonNullable<typeof t> =>
        !!t && (t.totalBorrowedValueWithWeight > 0 || t.totalDepositedValue > 0)
    )
    .map((obligationAccount) => {
      return {
        obligationId: obligationAccount.obligationId,
        totalDebtsInUsd: obligationAccount.totalBorrowedValueWithWeight,
        totalCollateralInUsd: obligationAccount.totalDepositedValue,
        riskLevel: obligationAccount.totalRiskLevel,
        availableCollateralInUsd:
          obligationAccount.totalAvailableCollateralValue,
        totalUnhealthyCollateralInUsd:
          obligationAccount.totalUnhealthyCollateralValue,
        collaterals: Object.values(obligationAccount.collaterals)
          .filter(
            (collateral): collateral is NonNullable<typeof collateral> =>
              !!collateral && collateral.depositedCoin > 0
          )
          .map((collateral) => ({
            coinName: collateral.coinName,
            symbol: collateral.symbol,
            coinDecimals: collateral.coinDecimal,
            coinType: collateral.coinType,
            coinPrice: collateral.coinPrice,
            depositedCoin: collateral.depositedCoin,
            depositedValueInUsd: collateral.depositedValue,
          })),
        borrowedPools: Object.values(obligationAccount.debts)
          .filter(
            (debt): debt is NonNullable<typeof debt> =>
              !!debt && debt.borrowedCoin > 0
          )
          .map((debt) => ({
            coinName: debt.coinName,
            symbol: debt.symbol,
            coinDecimals: debt.coinDecimal,
            coinType: debt.coinType,
            coinPrice: debt.coinPrice,
            borrowedCoin: debt.borrowedCoin,
            borrowedValueInUsd: debt.borrowedValueWithWeight,
            borrowApr: market.pools[debt.coinName]?.borrowApr,
            borrowApy: market.pools[debt.coinName]?.borrowApy,
            incentiveInfos: Object.values(
              borrowIncentivePools[debt.coinName]?.points ?? {}
            )
              .filter(
                (t): t is NonNullable<typeof t> => !!t && isFinite(t.rewardApr)
              )
              .map((t) => ({
                coinName: t.coinName,
                symbol: t.symbol,
                coinType: t.coinType,
                incentiveApr: t.rewardApr,
              })),
          })),
      };
    });

  const LENDING_SPOOL_REWARD_COIN_NAME = 'sui' as const;
  const LENDING_SPOOL_REWARD_COIN_SYMBOL = 'SUI' as const;
  const pendingLendingRewards = Object.values(lendings).reduce(
    (acc, reward) => {
      if (reward) {
        if (reward.availableClaimCoin === 0) return acc;
        if (!acc[LENDING_SPOOL_REWARD_COIN_NAME]) {
          acc[LENDING_SPOOL_REWARD_COIN_NAME] = {
            symbol: LENDING_SPOOL_REWARD_COIN_SYMBOL,
            coinType: normalizeStructTag(SUI_TYPE_ARG), // @TODO: for now lending reward is all in SUI
            coinPrice: coinPrices[LENDING_SPOOL_REWARD_COIN_NAME] ?? 0,
            pendingRewardInCoin: reward.availableClaimCoin,
          };
        } else {
          acc[LENDING_SPOOL_REWARD_COIN_NAME].pendingRewardInCoin +=
            reward.availableClaimCoin;
        }
      }
      return acc;
    },
    {} as Record<
      string,
      {
        coinType: string;
        symbol: string;
        coinPrice: number;
        pendingRewardInCoin: number;
      }
    >
  );

  const pendingBorrowIncentiveRewards = Object.values(obligationAccounts)
    .filter((t): t is NonNullable<typeof t> => !!t)
    .reduce(
      (acc, curr) => {
        Object.values(curr.borrowIncentives).forEach((incentive) => {
          incentive?.rewards.forEach((reward) => {
            if (reward.availableClaimCoin === 0) return acc;
            if (!acc[reward.coinName]) {
              acc[reward.coinName] = {
                symbol: reward.symbol,
                coinType: reward.coinType,
                coinPrice: reward.coinPrice,
                pendingRewardInCoin: reward.availableClaimCoin,
              };
            } else {
              acc[reward.coinName].pendingRewardInCoin +=
                reward.availableClaimCoin;
            }
          });
        });
        return acc;
      },
      {} as Record<
        string,
        {
          coinType: string;
          symbol: string;
          coinPrice: number;
          pendingRewardInCoin: number;
        }
      >
    );

  const parsedVeScas = veScas.map(
    ({ keyId, lockedScaCoin, currentVeScaBalance, unlockAt }) => ({
      veScaKey: keyId,
      coinPrice: coinPrices.sca ?? 0,
      lockedScaInCoin: lockedScaCoin,
      lockedScaInUsd: lockedScaCoin * (coinPrices.sca ?? 0),
      currentVeScaBalance,
      remainingLockPeriodInDays:
        unlockAt - Date.now() > 0 ? (unlockAt - Date.now()) / 86400000 : 0,
      unlockAt,
    })
  );

  return {
    totalSupplyValue: parsedLendings.reduce((acc, curr) => {
      acc += curr.suppliedValue;
      return acc;
    }, 0),
    ...parsedObligationAccounts.reduce(
      (acc, curr) => {
        acc.totalDebtValue += curr.totalDebtsInUsd;
        acc.totalCollateralValue += curr.totalCollateralInUsd;
        return acc;
      },
      {
        totalDebtValue: 0,
        totalCollateralValue: 0,
      } as {
        totalDebtValue: number;
        totalCollateralValue: number;
      }
    ),
    totalLockedScaValue: parsedVeScas.reduce((acc, curr) => {
      acc += curr.lockedScaInUsd;
      return acc;
    }, 0),
    lendings: parsedLendings,
    borrowings: parsedObligationAccounts,
    pendingRewards: {
      lendings: Object.entries(pendingLendingRewards).reduce(
        (acc, [_, value]) => {
          acc.push({
            ...value,
            coinName: 'sui',
            pendingRewardInUsd: value.coinPrice * value.pendingRewardInCoin,
          });
          return acc;
        },
        [] as any
      ),
      borrowIncentives: Object.entries(pendingBorrowIncentiveRewards).reduce(
        (acc, [key, value]) => {
          acc.push({
            coinName: key,
            ...value,
            pendingRewardInUsd: value.coinPrice * value.pendingRewardInCoin,
          });
          return acc;
        },
        [] as any
      ),
    },
    veScas: parsedVeScas,
  };
};
