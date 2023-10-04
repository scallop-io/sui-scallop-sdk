import BigNumber from 'bignumber.js';
import { SUPPORT_POOLS, SUPPORT_SPOOLS } from '../constants';
import type { ScallopQuery } from '../models';
import type {
  Market,
  SupportCoins,
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
} from '../types';

/**
 * Get user lending infomation for specific pools.
 *
 * @param query - The ScallopQuery instance.
 * @param coinNames - Specific an array of support coin name.
 * @param ownerAddress - The owner address.
 * @return User lending infomation for specific pools.
 */
export const getLendings = async (
  query: ScallopQuery,
  coinNames?: SupportPoolCoins[],
  ownerAddress?: string
) => {
  coinNames = coinNames || [...SUPPORT_POOLS];
  const marketCoinNames = coinNames
    ?.map((coinName) => `s${coinName}`)
    .filter((marketCoinName) =>
      [...SUPPORT_SPOOLS].includes(marketCoinName as any)
    ) as SupportStakeMarketCoins[];

  const marketPools = await query.getMarketPools(coinNames);
  const sPools = await query.getSpools(marketCoinNames);
  const coinAmounts = await query.getCoinAmounts(coinNames, ownerAddress);
  const marketCoinAmounts = await query.getMarketCoinAmounts(
    marketCoinNames,
    ownerAddress
  );
  const allStakeAccounts = await query.getAllStakeAccounts(ownerAddress);
  const coinPrices = await query.utils.getCoinPrices(coinNames);

  const lendings: Lendings = {};
  for (const coinName of coinNames) {
    const marketCoinName = marketCoinNames.find(
      (marketCoinName) => marketCoinName === `s${coinName}`
    );
    lendings[coinName] = await getLending(
      query,
      coinName,
      ownerAddress,
      marketPools?.[coinName],
      marketCoinName ? sPools[marketCoinName] : undefined,
      marketCoinName ? allStakeAccounts[marketCoinName] : undefined,
      coinAmounts?.[coinName],
      marketCoinAmounts?.[coinName],
      coinPrices?.[coinName] ?? 0
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
 * @param coinName - Specific support coin name.
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
  coinName: SupportPoolCoins,
  ownerAddress?: string,
  marketPool?: MarketPool,
  spool?: Spool,
  stakeAccounts?: StakeAccount[],
  coinAmount?: number,
  marketCoinAmount?: number,
  coinPrice?: number
) => {
  const marketCoinName = `s${coinName}` as any;
  marketPool = marketPool || (await query.getMarketPool(coinName));
  spool =
    spool || [...SUPPORT_SPOOLS].includes(marketCoinName as any)
      ? await query.getSpool(marketCoinName)
      : undefined;
  stakeAccounts =
    stakeAccounts ||
    (await query.getStakeAccounts(marketCoinName, ownerAddress));
  coinAmount =
    coinAmount || (await query.getCoinAmount(coinName, ownerAddress));
  marketCoinAmount =
    marketCoinAmount ||
    (await query.getMarketCoinAmount(marketCoinName, ownerAddress));
  coinPrice =
    coinPrice || (await query.utils.getCoinPrices([coinName]))?.[coinName];
  const coinDecimal = query.utils.getCoinDecimal(coinName);

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
      const accountStakedCoin = accountStakedMarketCoin.shiftedBy(
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
    coin: coinName,
    symbol: query.utils.parseSymbol(coinName),
    coinType: query.utils.parseCoinType(coinName),
    marketCoinType: query.utils.parseMarketCoinType(coinName),
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
  const coinNames: SupportCoins[] = [
    ...new Set([
      ...market.pools.map((pool) => pool.coin),
      ...market.collaterals.map((collateral) => collateral.coin),
    ]),
  ];
  const obligationQuery = await query.queryObligation(obligationId);
  coinPrices = coinPrices || (await query.utils.getCoinPrices(coinNames));
  coinAmounts =
    coinAmounts || (await query.getCoinAmounts(coinNames, ownerAddress));

  const collaterals: ObligationAccount['collaterals'] = {};
  const debts: ObligationAccount['debts'] = {};
  let totalCollateralPools = 0;
  let totalCollateralValue = BigNumber(0);
  let totalBorrowCapacityValue = BigNumber(0);
  let totalRequiredCollateralValue = BigNumber(0);
  let totalDebtPools = 0;
  let totalDebtValue = BigNumber(0);
  let totalDebtValueWithWeight = BigNumber(0);

  for (const collateral of obligationQuery.collaterals) {
    const coinName = query.utils.parseCoinName(
      collateral.type.name
    ) as SupportCollateralCoins;
    const coinDecimal = query.utils.getCoinDecimal(coinName);
    const marketCollateral = market.collaterals.find(
      (collateral) => collateral.coin === coinName
    );
    const coinPrice = coinPrices?.[coinName];
    const coinAmount = coinAmounts?.[coinName] ?? 0;

    if (marketCollateral && coinPrice) {
      const collateralAmount = BigNumber(collateral.amount);
      const collateralCoin = collateralAmount.shiftedBy(-1 * coinDecimal);
      const collateralValue = collateralCoin.multipliedBy(coinPrice);
      const borrowCapacityValue = collateralValue.multipliedBy(
        marketCollateral.collateralFactor
      );
      const requiredCollateralValue = collateralValue.multipliedBy(
        marketCollateral.liquidationFactor
      );
      const availableDepositAmount = BigNumber(coinAmount);
      const availableDepositCoin = availableDepositAmount.shiftedBy(
        -1 * coinDecimal
      );

      totalCollateralValue = totalCollateralValue.plus(collateralValue);
      totalBorrowCapacityValue =
        totalBorrowCapacityValue.plus(borrowCapacityValue);
      totalRequiredCollateralValue = totalRequiredCollateralValue.plus(
        requiredCollateralValue
      );

      if (collateralAmount.isGreaterThan(0)) {
        totalCollateralPools++;
      }

      collaterals[coinName] = {
        coinName: coinName,
        coinType: collateral.type.name,
        collateralAmount: collateralAmount.toNumber(),
        collateralCoin: collateralCoin.toNumber(),
        collateralValue: collateralValue.toNumber(),
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
    const coinName = query.utils.parseCoinName(
      debt.type.name
    ) as SupportPoolCoins;
    const coinDecimal = query.utils.getCoinDecimal(coinName);
    const marketPool = market.pools.find((pool) => pool.coin === coinName);
    const coinPrice = coinPrices?.[coinName];

    if (marketPool && coinPrice) {
      const increasedRate =
        marketPool.borrowIndex / Number(debt.borrowIndex) - 1;
      const debtAmount = BigNumber(debt.amount);
      const debtCoin = debtAmount.shiftedBy(-1 * coinDecimal);
      const availableRepayAmount = debtAmount.multipliedBy(increasedRate + 1);
      const availableRepayCoin = availableRepayAmount.shiftedBy(
        -1 * coinDecimal
      );
      const debtValue = availableRepayCoin.multipliedBy(coinPrice);
      const debtValueWithWeight = debtValue.multipliedBy(
        marketPool.borrowWeight
      );

      totalDebtValue = totalDebtValue.plus(debtValue);
      totalDebtValueWithWeight =
        totalDebtValueWithWeight.plus(debtValueWithWeight);

      if (debtAmount.isGreaterThan(0)) {
        totalDebtPools++;
      }

      debts[coinName] = {
        coinName: coinName,
        coinType: debt.type.name,
        debtAmount: debtAmount.toNumber(),
        debtCoin: debtCoin.toNumber(),
        debtValue: debtValue.toNumber(),
        debtValueWithWeight: debtValueWithWeight.toNumber(),
        borrowIndex: Number(debt.borrowIndex),
        availableBorrowAmount: 0,
        availableBorrowCoin: 0,
        availableRepayAmount: availableRepayAmount.toNumber(),
        availableRepayCoin: availableRepayCoin.toNumber(),
      };
    }
  }

  let riskLevel =
    totalRequiredCollateralValue.isZero() && totalDebtValueWithWeight.isZero()
      ? BigNumber(0)
      : totalDebtValueWithWeight.dividedBy(totalRequiredCollateralValue);
  riskLevel = riskLevel.isFinite()
    ? riskLevel.isLessThan(1)
      ? riskLevel
      : BigNumber(1)
    : BigNumber(1);

  const accountBalanceValue = totalCollateralValue
    .minus(totalDebtValue)
    .isGreaterThan(0)
    ? totalCollateralValue.minus(totalDebtValue)
    : BigNumber(0);
  const availableCollateralValue = totalBorrowCapacityValue
    .minus(totalDebtValueWithWeight)
    .isGreaterThan(0)
    ? totalBorrowCapacityValue.minus(totalDebtValueWithWeight)
    : BigNumber(0);
  const requiredCollateralValue = totalDebtValueWithWeight.isGreaterThan(0)
    ? totalRequiredCollateralValue
    : BigNumber(0);
  const unhealthyCollateralValue = totalDebtValueWithWeight
    .minus(requiredCollateralValue)
    .isGreaterThan(0)
    ? totalDebtValueWithWeight.minus(requiredCollateralValue)
    : BigNumber(0);

  const obligationAccount: ObligationAccount = {
    obligationId: obligationId,
    // Deposited collateral value (collateral balance)
    totalCollateralValue: totalCollateralValue.toNumber(),
    // Borrowed debt value (liabilities balance)
    totalDebtValue: totalDebtValue.toNumber(),
    // The difference between the user’s actual deposit and loan (remaining balance)
    totalBalanceValue: accountBalanceValue.toNumber(),
    // Effective collateral value (the actual collateral value included in the calculation).
    totalBorrowCapacityValue: totalBorrowCapacityValue.toNumber(),
    // Available collateral value (the remaining collateral value that can be borrowed).
    availableCollateralValue: availableCollateralValue.toNumber(),
    // Available debt value (the actual borrowing value included in the calculation).
    totalDebtValueWithWeight: totalDebtValueWithWeight.toNumber(),
    // Required collateral value (avoid be liquidated).
    requiredCollateralValue: requiredCollateralValue.toNumber(),
    // Unliquidated collateral value (pending liquidation).
    unhealthyCollateralValue: unhealthyCollateralValue.toNumber(),
    riskLevel: riskLevel.toNumber(),
    totalCollateralPools,
    totalDebtPools,
    collaterals,
    debts,
  };

  for (const [coinName, obligationCollateral] of Object.entries(
    obligationAccount.collaterals
  )) {
    const marketCollateral = market.collaterals.find(
      (collateral) => collateral.coin === coinName
    );
    if (marketCollateral) {
      const availableWithdrawAmount =
        obligationAccount.totalDebtValueWithWeight === 0
          ? obligationCollateral.collateralAmount
          : Math.min(
              BigNumber(obligationAccount.availableCollateralValue)
                .dividedBy(marketCollateral.collateralFactor)
                .dividedBy(marketCollateral.coinPrice)
                // Note: reduced chance of failure when calculations are inaccurate
                .multipliedBy(0.99)
                .toNumber(),
              obligationCollateral.collateralAmount,
              marketCollateral.depositAmount
            );
      obligationCollateral.availableWithdrawAmount = availableWithdrawAmount;
      obligationCollateral.availableWithdrawCoin = availableWithdrawAmount;
    }
  }
  for (const [coinName, obligationDebt] of Object.entries(
    obligationAccount.debts
  )) {
    const marketPool = market.pools.find((pool) => pool.coin === coinName);
    if (marketPool) {
      const availableRepayAmount = BigNumber(
        obligationDebt.availableRepayAmount
      )
        // Note: reduced chance of failure when calculations are inaccurate
        .multipliedBy(1.01)
        .toNumber();

      const availableBorrowAmount =
        obligationAccount.availableCollateralValue !== 0
          ? Math.min(
              BigNumber(obligationAccount.availableCollateralValue)
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

export const getTotalValueLocked = async (_query: ScallopQuery) => {};
