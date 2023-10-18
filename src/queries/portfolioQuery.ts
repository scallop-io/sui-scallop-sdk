import BigNumber from 'bignumber.js';
import { SUPPORT_POOLS, SUPPORT_SPOOLS } from '../constants';
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
} from '../types';

/**
 * Get user lending infomation for specific pools.
 *
 * @param query - The ScallopQuery instance.
 * @param poolCoinNames - Specific an array of support pool coin name.
 * @param ownerAddress - The owner address.
 * @return User lending infomation for specific pools.
 */
export const getLendings = async (
  query: ScallopQuery,
  poolCoinNames?: SupportPoolCoins[],
  ownerAddress?: string
) => {
  poolCoinNames = poolCoinNames || [...SUPPORT_POOLS];
  const marketCoinNames = poolCoinNames.map((poolCoinName) =>
    query.utils.parseMarketCoinName(poolCoinName)
  );
  const stakeMarketCoinNames = marketCoinNames.filter((marketCoinName) =>
    (SUPPORT_SPOOLS as readonly SupportMarketCoins[]).includes(marketCoinName)
  ) as SupportStakeMarketCoins[];

  const marketPools = await query.getMarketPools(poolCoinNames);
  const spools = await query.getSpools(stakeMarketCoinNames);
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
  marketPool?: MarketPool,
  spool?: Spool,
  stakeAccounts?: StakeAccount[],
  coinAmount?: number,
  marketCoinAmount?: number,
  coinPrice?: number
) => {
  const marketCoinName = query.utils.parseMarketCoinName(poolCoinName);
  marketPool = marketPool || (await query.getMarketPool(poolCoinName));
  spool =
    spool ||
    (SUPPORT_SPOOLS as readonly SupportMarketCoins[]).includes(marketCoinName)
      ? await query.getSpool(marketCoinName as SupportStakeMarketCoins)
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
  let availableClaimAmount = BigNumber(0);

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

      const baseIndexRate = 1_000_000_000;
      const increasedPointRate = spool?.currentPointIndex
        ? BigNumber(spool.currentPointIndex - stakeAccount.index).dividedBy(
            baseIndexRate
          )
        : 1;
      availableClaimAmount = availableClaimAmount.plus(
        BigNumber(stakeAccount.staked)
          .multipliedBy(increasedPointRate)
          .plus(stakeAccount.points)
          .multipliedBy(spool.exchangeRateNumerator)
          .dividedBy(spool.exchangeRateDenominator)
      );
    }
  }

  // Handle supplied coin
  const suppliedAmount = BigNumber(marketCoinAmount).multipliedBy(
    marketPool?.conversionRate ?? 1
  );
  const suppliedCoin = suppliedAmount.shiftedBy(-1 * coinDecimal);
  const suppliedValue = suppliedCoin.multipliedBy(coinPrice ?? 0);

  const lending: Lending = {
    coinName: poolCoinName,
    symbol: query.utils.parseSymbol(poolCoinName),
    coinType: query.utils.parseCoinType(poolCoinName),
    marketCoinType: query.utils.parseMarketCoinType(poolCoinName),
    coinDecimal: coinDecimal,
    coinPrice: coinPrice ?? 0,
    supplyApr: marketPool?.supplyApr ?? 0,
    supplyApy: marketPool?.supplyApy ?? 0,
    rewardApr: spool?.stakeApr ?? 0,
    suppliedAmount: suppliedAmount.plus(stakedAmount).toNumber(),
    suppliedCoin: suppliedCoin.plus(stakedCoin).toNumber(),
    suppliedValue: suppliedValue.plus(stakedValue).toNumber(),
    stakedMarketAmount: stakedMarketAmount.toNumber(),
    stakedMarketCoin: stakedMarketCoin.toNumber(),
    stakedAmount: stakedAmount.toNumber(),
    stakedCoin: stakedCoin.toNumber(),
    stakedValue: stakedValue.toNumber(),
    availableSupplyAmount: coinAmount,
    availableWithdrawAmount: 0,
    availableStakeAmount: marketCoinAmount,
    availableUnstakeAmount: availableUnstakeAmount.toNumber(),
    availableClaimAmount: availableClaimAmount.toNumber(),
  };

  return lending;
};

/**
 * Get all obligation accounts data.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @return All obligation accounts data.
 */
export const getObligationAccounts = async (
  query: ScallopQuery,
  ownerAddress?: string
) => {
  const market = await query.queryMarket();
  const coinPrices = await query.utils.getCoinPrices();
  const coinAmounts = await query.getCoinAmounts(undefined, ownerAddress);
  const obligations = await query.getObligations(ownerAddress);

  const obligationAccounts: ObligationAccounts = {};
  for (const obligation of obligations) {
    obligationAccounts[obligation.keyId] = await getObligationAccount(
      query,
      obligation.id,
      ownerAddress,
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
 * @return Obligation account data.
 */
export const getObligationAccount = async (
  query: ScallopQuery,
  obligationId: string,
  ownerAddress?: string,
  market?: Market,
  coinPrices?: CoinPrices,
  coinAmounts?: CoinAmounts
) => {
  market = market || (await query.queryMarket());
  const assetCoinNames: SupportAssetCoins[] = [
    ...new Set([
      ...Object.values(market.pools).map((pool) => pool.coinName),
      ...Object.values(market.collaterals).map(
        (collateral) => collateral.coinName
      ),
    ]),
  ];
  const obligationQuery = await query.queryObligation(obligationId);
  coinPrices = coinPrices || (await query.utils.getCoinPrices(assetCoinNames));
  coinAmounts =
    coinAmounts || (await query.getCoinAmounts(assetCoinNames, ownerAddress));

  const collaterals: ObligationAccount['collaterals'] = {};
  const debts: ObligationAccount['debts'] = {};
  let totalDepositedPools = 0;
  let totalDepositedValue = BigNumber(0);
  let totalBorrowCapacityValue = BigNumber(0);
  let totalRequiredCollateralValue = BigNumber(0);
  let totalBorrowedPools = 0;
  let totalBorrowedValue = BigNumber(0);
  let totalBorrowedValueWithWeight = BigNumber(0);

  for (const collateral of obligationQuery.collaterals) {
    const collateralCoinName =
      query.utils.parseCoinNameFromType<SupportCollateralCoins>(
        collateral.type.name
      );
    const coinDecimal = query.utils.getCoinDecimal(collateralCoinName);
    const marketCollateral = market.collaterals[collateralCoinName];
    const coinPrice = coinPrices?.[collateralCoinName];
    const coinAmount = coinAmounts?.[collateralCoinName] ?? 0;

    if (marketCollateral && coinPrice) {
      const depositedAmount = BigNumber(collateral.amount);
      const depositedCoin = depositedAmount.shiftedBy(-1 * coinDecimal);
      const depositedValue = depositedCoin.multipliedBy(coinPrice);
      const borrowCapacityValue = depositedValue.multipliedBy(
        marketCollateral.collateralFactor
      );
      const requiredCollateralValue = depositedValue.multipliedBy(
        marketCollateral.liquidationFactor
      );
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

      collaterals[collateralCoinName] = {
        coinName: collateralCoinName,
        coinType: collateral.type.name,
        symbol: query.utils.parseSymbol(collateralCoinName),
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

  for (const debt of obligationQuery.debts) {
    const poolCoinName = query.utils.parseCoinNameFromType<SupportPoolCoins>(
      debt.type.name
    );
    const coinDecimal = query.utils.getCoinDecimal(poolCoinName);
    const marketPool = market.pools[poolCoinName];
    const coinPrice = coinPrices?.[poolCoinName];

    if (marketPool && coinPrice) {
      const increasedRate =
        marketPool.borrowIndex / Number(debt.borrowIndex) - 1;
      const borrowedAmount = BigNumber(debt.amount);
      const borrowedCoin = borrowedAmount.shiftedBy(-1 * coinDecimal);
      const availableRepayAmount = borrowedAmount.multipliedBy(
        increasedRate + 1
      );
      const availableRepayCoin = availableRepayAmount.shiftedBy(
        -1 * coinDecimal
      );
      const borrowedValue = availableRepayCoin.multipliedBy(coinPrice);
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

      debts[poolCoinName] = {
        coinName: poolCoinName,
        coinType: debt.type.name,
        symbol: query.utils.parseSymbol(poolCoinName),
        borrowedAmount: borrowedAmount.toNumber(),
        borrowedCoin: borrowedCoin.toNumber(),
        borrowedValue: borrowedValue.toNumber(),
        borrowedValueWithWeight: borrowedValueWithWeight.toNumber(),
        borrowIndex: Number(debt.borrowIndex),
        availableBorrowAmount: 0,
        availableBorrowCoin: 0,
        availableRepayAmount: availableRepayAmount.toNumber(),
        availableRepayCoin: availableRepayCoin.toNumber(),
      };
    }
  }

  let riskLevel =
    totalRequiredCollateralValue.isZero() &&
    totalBorrowedValueWithWeight.isZero()
      ? BigNumber(0)
      : totalBorrowedValueWithWeight.dividedBy(totalRequiredCollateralValue);
  riskLevel = riskLevel.isFinite()
    ? riskLevel.isLessThan(1)
      ? riskLevel
      : BigNumber(1)
    : BigNumber(1);

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
  };

  for (const [collateralCoinName, obligationCollateral] of Object.entries(
    obligationAccount.collaterals
  )) {
    const marketCollateral =
      market.collaterals[collateralCoinName as SupportCollateralCoins];
    if (marketCollateral) {
      const availableWithdrawAmount =
        obligationAccount.totalBorrowedValueWithWeight === 0
          ? obligationCollateral.depositedAmount
          : Math.min(
              BigNumber(obligationAccount.totalAvailableCollateralValue)
                .dividedBy(marketCollateral.collateralFactor)
                .dividedBy(marketCollateral.coinPrice)
                // Note: reduced chance of failure when calculations are inaccurate
                .multipliedBy(0.99)
                .toNumber(),
              obligationCollateral.depositedAmount,
              marketCollateral.depositAmount
            );
      obligationCollateral.availableWithdrawAmount = availableWithdrawAmount;
      obligationCollateral.availableWithdrawCoin = availableWithdrawAmount;
    }
  }
  for (const [assetCoinName, obligationDebt] of Object.entries(
    obligationAccount.debts
  )) {
    const marketPool = market.pools[assetCoinName as SupportPoolCoins];
    if (marketPool) {
      const availableRepayAmount = BigNumber(
        obligationDebt.availableRepayAmount
      )
        // Note: reduced chance of failure when calculations are inaccurate
        .multipliedBy(1.01)
        .toNumber();

      const availableBorrowAmount =
        obligationAccount.totalAvailableCollateralValue !== 0
          ? Math.min(
              BigNumber(obligationAccount.totalAvailableCollateralValue)
                .dividedBy(
                  BigNumber(marketPool.coinPrice).multipliedBy(
                    marketPool.borrowWeight
                  )
                )
                // Note: reduced chance of failure when calculations are inaccurate
                .multipliedBy(0.99)
                .toNumber(),
              marketPool.supplyAmount
            )
          : 0;
      obligationDebt.availableBorrowAmount = availableBorrowAmount;
      obligationDebt.availableRepayAmount = availableRepayAmount;
    }
  }

  return obligationAccount;
};

/**
 * Get total value locked data.
 *
 * @param query - The Scallop query instance.
 * @return Total value locked data.
 */
export const getTotalValueLocked = async (query: ScallopQuery) => {
  const market = await query.queryMarket();

  let supplyValue = BigNumber(0);
  let borrowValue = BigNumber(0);

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
