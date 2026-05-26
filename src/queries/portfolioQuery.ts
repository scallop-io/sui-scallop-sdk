import { BigNumber } from 'bignumber.js';
import {
  minBigNumber,
  resolveQuerySource,
  runWithSourceFallback,
  type QueryOptions,
} from 'src/utils/index.js';
import {
  calculateTotalValueLocked,
  parseLendingsForPortfolio,
  parseObligationAccountsForPortfolio,
  aggregatePendingLendingRewards,
  aggregatePendingBorrowIncentiveRewards,
  parseVeScasForPortfolio,
  summarisePortfolioTotals,
  buildObligationCollateralEntry,
  buildObligationDebtEntry,
  buildBorrowIncentiveRewards,
  calculateObligationSummary,
  estimateAvailableWithdrawAmount,
  estimateAvailableBorrowAmount,
} from 'src/services/index.js';
import type { ScallopQuery } from 'src/models/index.js';
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
  MarketPools,
  MarketCollaterals,
  SuiObjectRef,
} from 'src/types/index.js';

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
 * @param market - The market data.
 * @param coinPrices - The coin prices data.
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
 * Get all obligation accounts data by ids.
 *
 * @param query - The Scallop query instance.
 * @param obligationIds - Obligation account ids.
 * @param market - The market data.
 * @param coinPrices - The coin prices data.
 * @param indexer - Whether to use indexer.
 * @return All obligation accounts data.
 */
export const getObligationAccountsByIds = async (
  query: ScallopQuery,
  obligationIds: string[],
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

  const obligationAccounts: ObligationAccount[] = [];
  await Promise.allSettled(
    obligationIds.map(async (obligationId) => {
      const obligationAccount = await getObligationAccount(
        query,
        obligationId,
        '',
        indexer,
        market,
        coinPrices,
        {}
      );
      if (obligationAccount) obligationAccounts.push(obligationAccount);
    })
  );

  return obligationAccounts;
};

/**
 * Get obligation account data.
 *
 * @param query - The Scallop query instance.
 * @param obligation - The obligation id.
 * @param ownerAddress - The owner address of the obligation.
 * @param indexer - Whether to use indexer.
 * @param market - The market data.
 * @param coinPrices - The coin prices data.
 * @param coinAmounts - The coin amounts data.
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

  // -------- per-coin collateral entries --------
  for (const assetCoinName of Array.from(
    query.constants.whitelist.collateral
  )) {
    const onchainCollateral = obligationQuery?.collaterals.find(
      (collateral) =>
        query.utils.parseCoinNameFromType(collateral.type) === assetCoinName
    );

    const marketCollateral = market.collaterals[assetCoinName];
    if (!marketCollateral) continue;

    const built = buildObligationCollateralEntry({
      assetCoinName,
      coinType: query.utils.parseCoinType(assetCoinName),
      symbol: query.utils.parseSymbol(assetCoinName),
      coinDecimal: query.utils.getCoinDecimal(assetCoinName),
      coinPrice: coinPrices?.[assetCoinName] ?? 0,
      coinAmount: coinAmounts?.[assetCoinName] ?? 0,
      marketCollateral,
      depositedRawAmount: onchainCollateral?.amount,
    });
    totalDepositedValue = totalDepositedValue.plus(built.depositedValue);
    totalBorrowCapacityValue = totalBorrowCapacityValue.plus(
      built.borrowCapacityValue
    );
    totalRequiredCollateralValue = totalRequiredCollateralValue.plus(
      built.requiredCollateralValue
    );
    if (built.isDeposited) totalDepositedPools++;
    collaterals[assetCoinName] = built.entry;
  }

  // -------- borrow-incentive rewards per pool --------
  for (const [poolCoinName, borrowIncentiveAccount] of Object.entries(
    borrowIncentiveAccounts
  )) {
    if (!borrowIncentiveAccount) continue;
    const borrowIncentivePool = borrowIncentivePools[poolCoinName];
    if (!borrowIncentivePool) continue;

    const built = buildBorrowIncentiveRewards({
      borrowIncentivePool,
      borrowIncentiveAccount,
      toMarketCoinName: (key) =>
        query.utils.parseSCoinTypeNameToMarketCoinName(key),
    });
    if (built.contributesRewardedPool) totalRewardedPools++;
    borrowIncentives[poolCoinName] = {
      coinName: borrowIncentivePool.coinName,
      coinType: borrowIncentivePool.coinType,
      symbol: borrowIncentivePool.symbol,
      coinDecimal: borrowIncentivePool.coinDecimal,
      coinPrice: borrowIncentivePool.coinPrice,
      rewards: built.rewards,
    };
  }

  // -------- per-coin debt entries --------
  const borrowAssetCoinNames: string[] = [
    ...new Set(
      Object.values(market.pools)
        .filter((t): t is NonNullable<typeof t> => !!t)
        .map((pool) => pool.coinName)
    ),
  ];
  for (const assetCoinName of borrowAssetCoinNames) {
    const onchainDebt = obligationQuery?.debts.find(
      (debt) => query.utils.parseCoinNameFromType(debt.type) === assetCoinName
    );
    const marketPool = market.pools[assetCoinName];
    if (!marketPool) continue;

    const built = buildObligationDebtEntry({
      assetCoinName,
      coinType: query.utils.parseCoinType(assetCoinName),
      symbol: query.utils.parseSymbol(assetCoinName),
      coinDecimal: query.utils.getCoinDecimal(assetCoinName),
      coinPrice: coinPrices?.[assetCoinName] ?? 0,
      coinAmount: coinAmounts?.[assetCoinName] ?? 0,
      marketPool,
      debt: onchainDebt
        ? { amount: onchainDebt.amount, borrowIndex: onchainDebt.borrowIndex }
        : undefined,
      rewards: borrowIncentives[assetCoinName]?.rewards,
    });
    totalBorrowedValue = totalBorrowedValue.plus(built.borrowedValue);
    totalBorrowedValueWithWeight = totalBorrowedValueWithWeight.plus(
      built.borrowedValueWithWeight
    );
    if (built.isBorrowed) totalBorrowedPools++;
    debts[assetCoinName] = built.entry;
  }

  // -------- aggregate risk / balances --------
  const summary = calculateObligationSummary({
    totalDepositedValue,
    totalBorrowedValue,
    totalBorrowCapacityValue,
    totalBorrowedValueWithWeight,
    totalRequiredCollateralValue,
  });

  const obligationAccount: ObligationAccount = {
    obligationId:
      typeof obligation === 'string' ? obligation : obligation.objectId,
    totalDepositedValue: totalDepositedValue.toNumber(),
    totalBorrowedValue: totalBorrowedValue.toNumber(),
    totalBalanceValue: summary.accountBalanceValue,
    totalBorrowCapacityValue: totalBorrowCapacityValue.toNumber(),
    totalAvailableCollateralValue: summary.availableCollateralValue,
    totalBorrowedValueWithWeight: totalBorrowedValueWithWeight.toNumber(),
    totalRequiredCollateralValue: summary.requiredCollateralValue,
    totalUnhealthyCollateralValue: summary.unhealthyCollateralValue,
    totalRiskLevel: summary.riskLevel,
    totalDepositedPools,
    totalBorrowedPools,
    totalRewardedPools,
    collaterals,
    debts,
    borrowIncentives,
  };

  // -------- second pass: estimate available withdraw/borrow --------
  for (const [collateralCoinName, obligationCollateral] of Object.entries(
    obligationAccount.collaterals
  )) {
    if (!obligationCollateral) continue;
    const marketCollateral = market.collaterals[collateralCoinName];
    if (!marketCollateral) continue;
    const { availableWithdrawAmount, availableWithdrawCoin } =
      estimateAvailableWithdrawAmount({
        obligationCollateral,
        marketCollateral,
        totalAvailableCollateralValue:
          obligationAccount.totalAvailableCollateralValue,
        totalBorrowedValueWithWeight:
          obligationAccount.totalBorrowedValueWithWeight,
      });
    obligationCollateral.availableWithdrawAmount = availableWithdrawAmount;
    obligationCollateral.availableWithdrawCoin = availableWithdrawCoin;
  }
  for (const [poolCoinName, obligationDebt] of Object.entries(
    obligationAccount.debts
  )) {
    if (!obligationDebt) continue;
    const marketPool = market.pools[poolCoinName];
    if (!marketPool) continue;
    const {
      availableBorrowAmount,
      availableBorrowCoin,
      requiredRepayAmount,
      requiredRepayCoin,
    } = estimateAvailableBorrowAmount({
      obligationDebt,
      marketPool,
      totalAvailableCollateralValue:
        obligationAccount.totalAvailableCollateralValue,
    });
    obligationDebt.availableBorrowAmount = availableBorrowAmount;
    obligationDebt.availableBorrowCoin = availableBorrowCoin;
    obligationDebt.requiredRepayAmount = requiredRepayAmount;
    obligationDebt.requiredRepayCoin = requiredRepayCoin;
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
  options: boolean | QueryOptions = false
) => {
  const queryOptions =
    typeof options === 'boolean' ? { indexer: options } : options;
  const source = resolveQuerySource(queryOptions);

  return runWithSourceFallback({
    source,
    label: 'getTotalValueLocked',
    indexer: async () => {
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
    },
    rpc: async () => {
      const market = await query.getMarketPools(undefined, { indexer: false });
      return calculateTotalValueLocked(market);
    },
  });
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

  const [lendings, obligationAccounts, veScas] = await Promise.all([
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
    query.getVeScas({ walletAddress, excludeEmpty: true }),
  ]);

  const parsedLendings = parseLendingsForPortfolio(lendings);
  const parsedObligationAccounts = parseObligationAccountsForPortfolio(
    obligationAccounts,
    market.pools
  );
  const pendingLendingRewards = aggregatePendingLendingRewards(
    lendings,
    coinPrices
  );
  const pendingBorrowIncentiveRewards =
    aggregatePendingBorrowIncentiveRewards(obligationAccounts);
  const parsedVeScas = parseVeScasForPortfolio(veScas, coinPrices.sca ?? 0);
  const totals = summarisePortfolioTotals({
    parsedLendings,
    parsedObligationAccounts,
    parsedVeScas,
  });

  return {
    ...totals,
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
