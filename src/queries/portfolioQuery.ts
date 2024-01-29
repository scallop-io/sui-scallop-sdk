import BigNumber from 'bignumber.js';
import { SUPPORT_POOLS, SUPPORT_SPOOLS } from '../constants';
import { minBigNumber, estimatedFactor } from 'src/utils';
import type { ScallopQuery } from '../models';
import type {
  Market,
  SupportAssetCoins,
  SupportPoolCoins,
  MarketPool,
  Spool,
  StakeAccount,
  Lendings,
  Lending,
  ObligationAccounts,
  ObligationAccount,
  SupportStakeMarketCoins,
  SupportCollateralCoins,
  CoinAmounts,
  CoinPrices,
  SupportMarketCoins,
  TotalValueLocked,
  SupportBorrowIncentiveCoins,
} from '../types';

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
  poolCoinNames?: SupportPoolCoins[],
  ownerAddress?: string,
  indexer: boolean = false
) => {
  poolCoinNames = poolCoinNames || [...SUPPORT_POOLS];
  const marketCoinNames = poolCoinNames.map((poolCoinName) =>
    query.utils.parseMarketCoinName(poolCoinName)
  );
  const stakeMarketCoinNames = marketCoinNames.filter((marketCoinName) =>
    (SUPPORT_SPOOLS as readonly SupportMarketCoins[]).includes(marketCoinName)
  ) as SupportStakeMarketCoins[];

  const marketPools = await query.getMarketPools(poolCoinNames, indexer);
  const spools = await query.getSpools(stakeMarketCoinNames, indexer);
  const coinAmounts = await query.getCoinAmounts(poolCoinNames, ownerAddress);
  const marketCoinAmounts = await query.getMarketCoinAmounts(
    marketCoinNames,
    ownerAddress
  );
  const allStakeAccounts = await query.getAllStakeAccounts(ownerAddress);
  const coinPrices = await query.utils.getCoinPrices(poolCoinNames);

  const lendings: Lendings = {};
  for (const poolCoinName of poolCoinNames) {
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
      stakeMarketCoinName ? allStakeAccounts[stakeMarketCoinName] : undefined,
      coinAmounts?.[poolCoinName],
      marketCoinAmounts?.[marketCoinName],
      coinPrices?.[poolCoinName] ?? 0
    );
  }

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
  poolCoinName: SupportPoolCoins,
  ownerAddress?: string,
  indexer: boolean = false,
  marketPool?: MarketPool,
  spool?: Spool,
  stakeAccounts?: StakeAccount[],
  coinAmount?: number,
  marketCoinAmount?: number,
  coinPrice?: number
) => {
  const marketCoinName = query.utils.parseMarketCoinName(poolCoinName);
  marketPool = marketPool || (await query.getMarketPool(poolCoinName, indexer));
  spool =
    spool ||
    (SUPPORT_SPOOLS as readonly SupportMarketCoins[]).includes(marketCoinName)
      ? await query.getSpool(marketCoinName as SupportStakeMarketCoins, indexer)
      : undefined;
  stakeAccounts =
    stakeAccounts ||
    (SUPPORT_SPOOLS as readonly SupportMarketCoins[]).includes(marketCoinName)
      ? await query.getStakeAccounts(
          marketCoinName as SupportStakeMarketCoins,
          ownerAddress
        )
      : [];
  coinAmount =
    coinAmount || (await query.getCoinAmount(poolCoinName, ownerAddress));
  marketCoinAmount =
    marketCoinAmount ||
    (await query.getMarketCoinAmount(marketCoinName, ownerAddress));
  coinPrice =
    coinPrice ||
    (await query.utils.getCoinPrices([poolCoinName]))?.[poolCoinName];
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
  const suppliedAmount = BigNumber(marketCoinAmount).multipliedBy(
    marketPool?.conversionRate ?? 1
  );
  const suppliedCoin = suppliedAmount.shiftedBy(-1 * coinDecimal);
  const suppliedValue = suppliedCoin.multipliedBy(coinPrice ?? 0);

  const marketCoinPrice = BigNumber(coinPrice ?? 0).multipliedBy(
    marketPool?.conversionRate ?? 1
  );
  const unstakedMarketAmount = BigNumber(marketCoinAmount);
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
  indexer: boolean = false
) => {
  const market = await query.queryMarket(indexer);
  const coinPrices = await query.utils.getCoinPrices();
  const coinAmounts = await query.getCoinAmounts(undefined, ownerAddress);
  const obligations = await query.getObligations(ownerAddress);

  const obligationAccounts: ObligationAccounts = {};
  for (const obligation of obligations) {
    obligationAccounts[obligation.keyId] = await getObligationAccount(
      query,
      obligation.id,
      ownerAddress,
      indexer,
      market,
      coinPrices,
      coinAmounts
    );
  }

  return obligationAccounts;
};

/**
 * Get obligation account data.
 *
 * @param query - The Scallop query instance.
 * @param obligationId - The obligation id.
 * @param indexer - Whether to use indexer.
 * @return Obligation account data.
 */
export const getObligationAccount = async (
  query: ScallopQuery,
  obligationId: string,
  ownerAddress?: string,
  indexer: boolean = false,
  market?: Market,
  coinPrices?: CoinPrices,
  coinAmounts?: CoinAmounts
) => {
  market = market || (await query.queryMarket(indexer));
  const assetCoinNames: SupportAssetCoins[] = [
    ...new Set([
      ...Object.values(market.pools).map((pool) => pool.coinName),
      ...Object.values(market.collaterals).map(
        (collateral) => collateral.coinName
      ),
    ]),
  ];
  const obligationQuery = await query.queryObligation(obligationId);
  const borrowIncentivePools = await query.getBorrowIncentivePools(
    undefined,
    indexer
  );
  const borrowIncentiveAccounts =
    await query.getBorrowIncentiveAccounts(obligationId);
  coinPrices = coinPrices || (await query.utils.getCoinPrices(assetCoinNames));
  coinAmounts =
    coinAmounts || (await query.getCoinAmounts(assetCoinNames, ownerAddress));

  const collaterals: ObligationAccount['collaterals'] = {};
  const debts: ObligationAccount['debts'] = {};
  const borrowIncentives: ObligationAccount['borrowIncentives'] = {};
  let totalDepositedPools = 0;
  let totalDepositedValue = BigNumber(0);
  let totalBorrowCapacityValue = BigNumber(0);
  let totalRequiredCollateralValue = BigNumber(0);
  let totalBorrowedPools = 0;
  let totalBorrowedValue = BigNumber(0);
  let totalBorrowedValueWithWeight = BigNumber(0);

  for (const assetCoinName of assetCoinNames) {
    const collateral = obligationQuery.collaterals.find((collateral) => {
      const collateralCoinName =
        query.utils.parseCoinNameFromType<SupportCollateralCoins>(
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

      const poolSizeAmount = BigNumber(marketCollateral.maxDepositAmount).minus(
        marketCollateral.depositAmount
      );
      const availableDepositAmount = minBigNumber(
        BigNumber(coinAmount),
        poolSizeAmount
      );
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

  for (const assetCoinName of assetCoinNames) {
    const debt = obligationQuery.debts.find((debt) => {
      const poolCoinName = query.utils.parseCoinNameFromType<SupportPoolCoins>(
        debt.type.name
      );
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
      const borrowedAmount = BigNumber(debt?.amount ?? 0);
      const borrowedCoin = borrowedAmount.shiftedBy(-1 * coinDecimal);

      const requiredRepayAmount = borrowedAmount.multipliedBy(
        increasedRate + 1
      );
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
    const coinName = poolCoinName as SupportBorrowIncentiveCoins;
    const borrowIncentivePool = borrowIncentivePools[coinName];

    let availableClaimAmount = BigNumber(0);
    let availableClaimCoin = BigNumber(0);
    if (borrowIncentivePool) {
      const accountBorrowedAmount = BigNumber(borrowIncentiveAccount.amount);
      const baseIndexRate = 1_000_000_000;
      const increasedPointRate = borrowIncentivePool.currentPointIndex
        ? BigNumber(
            borrowIncentivePool.currentPointIndex - borrowIncentiveAccount.index
          ).dividedBy(baseIndexRate)
        : 1;
      availableClaimAmount = availableClaimAmount.plus(
        accountBorrowedAmount
          .multipliedBy(increasedPointRate)
          .plus(borrowIncentiveAccount.points)
          .multipliedBy(borrowIncentivePool.exchangeRateNumerator)
          .dividedBy(borrowIncentivePool.exchangeRateDenominator)
      );
      availableClaimCoin = availableClaimAmount.shiftedBy(
        -1 * borrowIncentivePool.rewardCoinDecimal
      );

      if (availableClaimAmount.isGreaterThan(0)) {
        borrowIncentives[coinName] = {
          coinName: borrowIncentivePool.coinName,
          coinType: borrowIncentivePool.coinType,
          rewardCoinType: borrowIncentivePool.rewardCoinType,
          symbol: borrowIncentivePool.symbol,
          coinDecimal: borrowIncentivePool.coinDecimal,
          rewardCoinDecimal: borrowIncentivePool.rewardCoinDecimal,
          coinPrice: borrowIncentivePool.coinPrice,
          rewardCoinPrice: borrowIncentivePool.rewardCoinPrice,
          availableClaimAmount: availableClaimAmount.toNumber(),
          availableClaimCoin: availableClaimCoin.toNumber(),
        };
      }
    }
  }

  let riskLevel = totalRequiredCollateralValue.isZero()
    ? BigNumber(0)
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
    obligationId: obligationId,
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
    collaterals,
    debts,
    borrowIncentives,
  };

  for (const [collateralCoinName, obligationCollateral] of Object.entries(
    obligationAccount.collaterals
  )) {
    const marketCollateral =
      market.collaterals[collateralCoinName as SupportCollateralCoins];
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
    const marketPool = market.pools[poolCoinName as SupportPoolCoins];
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
        obligationAccount.totalAvailableCollateralValue !== 0
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
  const market = await query.queryMarket(indexer);

  let supplyValue = BigNumber(0);
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
    };
    return tvl;
  }

  for (const pool of Object.values(market.pools)) {
    supplyValue = supplyValue.plus(
      BigNumber(pool.supplyCoin).multipliedBy(pool.coinPrice)
    );
    borrowValue = borrowValue.plus(
      BigNumber(pool.borrowCoin).multipliedBy(pool.coinPrice)
    );
  }

  for (const collateral of Object.values(market.collaterals)) {
    supplyValue = supplyValue.plus(
      BigNumber(collateral.depositCoin).multipliedBy(collateral.coinPrice)
    );
  }

  const tvl: TotalValueLocked = {
    supplyValue: supplyValue.toNumber(),
    borrowValue: borrowValue.toNumber(),
    totalValue: supplyValue.minus(borrowValue).toNumber(),
  };

  return tvl;
};
