import { BigNumber } from 'bignumber.js';
import { normalizeStructTag, SUI_TYPE_ARG } from '@scallop-io/sui-kit';
import { estimatedFactor, minBigNumber } from 'src/utils/index.js';
import type {
  BorrowIncentivePool,
  CoinAmounts,
  CoinPrices,
  Lending,
  Lendings,
  MarketCollateral,
  MarketCollaterals,
  MarketPool,
  MarketPools,
  ObligationAccount,
  ObligationAccounts,
  ObligationBorrowIncentiveReward,
  ObligationCollateral,
  ObligationDebt,
  ParsedBorrowIncentiveAccountData,
  Spool,
  StakeAccount,
  TotalValueLocked,
} from 'src/types/index.js';

export type TvlMarketInput = {
  pools: MarketPools;
  collaterals: MarketCollaterals;
};

export const calculateTotalValueLocked = (
  market: TvlMarketInput
): TotalValueLocked => {
  let supplyLendingValue = BigNumber(0);
  let supplyCollateralValue = BigNumber(0);
  let borrowValue = BigNumber(0);

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

  return {
    supplyValue: supplyLendingValue.plus(supplyCollateralValue).toNumber(),
    supplyLendingValue: supplyLendingValue.toNumber(),
    supplyCollateralValue: supplyCollateralValue.toNumber(),
    borrowValue: borrowValue.toNumber(),
    totalValue: supplyLendingValue
      .plus(supplyCollateralValue)
      .minus(borrowValue)
      .toNumber(),
  };
};

/* ============================================================
 *  User-portfolio aggregation helpers
 *
 *  Pure transforms over already-fetched data, lifted out of
 *  `getUserPortfolio` in `src/queries/portfolioQuery.ts` so the orchestrator
 *  shrinks to fetch + compose. Public return shape of `getUserPortfolio` is
 *  intentionally preserved.
 * ============================================================ */

export type PortfolioLending = {
  suppliedCoin: number;
  suppliedValue: number;
  stakedCoin: number;
  coinName: string;
  symbol: string;
  coinType: string;
  coinPrice: number;
  coinDecimals: number;
  supplyApr: number;
  supplyApy: number;
  incentiveApr: number;
};

export type PortfolioBorrowing = {
  obligationId: string;
  totalDebtsInUsd: number;
  totalCollateralInUsd: number;
  riskLevel: number;
  availableCollateralInUsd: number;
  totalUnhealthyCollateralInUsd: number;
  collaterals: Array<{
    coinName: string;
    symbol: string;
    coinDecimals: number;
    coinType: string;
    coinPrice: number;
    depositedCoin: number;
    depositedValueInUsd: number;
  }>;
  borrowedPools: Array<{
    coinName: string;
    symbol: string;
    coinDecimals: number;
    coinType: string;
    coinPrice: number;
    borrowedCoin: number;
    borrowedValueInUsd: number;
    borrowApr?: number;
    borrowApy?: number;
    incentiveInfos: Array<{
      coinName: string;
      symbol: string;
      coinType: string;
      boostValue: number;
      maxBoost: number;
      incentiveApr: number;
      boostedIncentiveApr: number;
    }>;
  }>;
};

export type PendingReward = {
  coinType: string;
  symbol: string;
  coinPrice: number;
  pendingRewardInCoin: number;
};

export type PortfolioVeSca = {
  veScaKey: string;
  coinPrice: number;
  lockedScaInCoin: number;
  lockedScaInUsd: number;
  currentVeScaBalance: number;
  remainingLockPeriodInDays: number;
  unlockAt: number;
};

export const parseLendingsForPortfolio = (
  lendings: Lendings
): PortfolioLending[] =>
  Object.values(lendings)
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

export const parseObligationAccountsForPortfolio = (
  obligationAccounts: ObligationAccounts,
  marketPools: Record<string, MarketPool | undefined>
): PortfolioBorrowing[] =>
  Object.values(obligationAccounts)
    .filter(
      (t): t is NonNullable<typeof t> =>
        !!t && (t.totalBorrowedValueWithWeight > 0 || t.totalDepositedValue > 0)
    )
    .map((obligationAccount) => ({
      obligationId: obligationAccount.obligationId,
      totalDebtsInUsd: obligationAccount.totalBorrowedValueWithWeight,
      totalCollateralInUsd: obligationAccount.totalDepositedValue,
      riskLevel: obligationAccount.totalRiskLevel,
      availableCollateralInUsd: obligationAccount.totalAvailableCollateralValue,
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
          borrowApr: marketPools[debt.coinName]?.borrowApr,
          borrowApy: marketPools[debt.coinName]?.borrowApy,
          incentiveInfos: (
            obligationAccount.borrowIncentives[debt.coinName]?.rewards ?? []
          )
            .filter(
              (t): t is NonNullable<typeof t> =>
                !!t && isFinite(t.baseRewardApr)
            )
            .map((t) => ({
              coinName: t.coinName,
              symbol: t.symbol,
              coinType: t.coinType,
              boostValue: t.boostValue,
              maxBoost: t.maxBoost,
              incentiveApr: t.baseRewardApr,
              boostedIncentiveApr: t.boostedRewardApr,
            })),
        })),
    }));

const LENDING_SPOOL_REWARD_COIN_NAME = 'sui' as const;
const LENDING_SPOOL_REWARD_COIN_SYMBOL = 'SUI' as const;

export const aggregatePendingLendingRewards = (
  lendings: Lendings,
  coinPrices: CoinPrices
): Record<string, PendingReward> =>
  Object.values(lendings).reduce(
    (acc, reward) => {
      if (reward) {
        if (reward.availableClaimCoin === 0) return acc;
        if (!acc[LENDING_SPOOL_REWARD_COIN_NAME]) {
          acc[LENDING_SPOOL_REWARD_COIN_NAME] = {
            symbol: LENDING_SPOOL_REWARD_COIN_SYMBOL,
            // For now lending reward is all in SUI; mirrors the legacy
            // `getUserPortfolio` behaviour.
            coinType: normalizeStructTag(SUI_TYPE_ARG),
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
    {} as Record<string, PendingReward>
  );

export const aggregatePendingBorrowIncentiveRewards = (
  obligationAccounts: ObligationAccounts
): Record<string, PendingReward> =>
  Object.values(obligationAccounts)
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
      {} as Record<string, PendingReward>
    );

export const parseVeScasForPortfolio = (
  veScas: Array<{
    keyId: string;
    lockedScaCoin: number;
    currentVeScaBalance: number;
    unlockAt: number;
  }>,
  scaPrice: number,
  nowMs: number = Date.now()
): PortfolioVeSca[] =>
  veScas.map(({ keyId, lockedScaCoin, currentVeScaBalance, unlockAt }) => ({
    veScaKey: keyId,
    coinPrice: scaPrice,
    lockedScaInCoin: lockedScaCoin,
    lockedScaInUsd: lockedScaCoin * scaPrice,
    currentVeScaBalance,
    remainingLockPeriodInDays:
      unlockAt - nowMs > 0 ? (unlockAt - nowMs) / 86400000 : 0,
    unlockAt,
  }));

export const summarisePortfolioTotals = (input: {
  parsedLendings: PortfolioLending[];
  parsedObligationAccounts: PortfolioBorrowing[];
  parsedVeScas: PortfolioVeSca[];
}) => {
  const totalSupplyValue = input.parsedLendings.reduce(
    (acc, curr) => acc + curr.suppliedValue,
    0
  );
  const obligationTotals = input.parsedObligationAccounts.reduce(
    (acc, curr) => {
      acc.totalDebtValue += curr.totalDebtsInUsd;
      acc.totalCollateralValue += curr.totalCollateralInUsd;
      return acc;
    },
    { totalDebtValue: 0, totalCollateralValue: 0 }
  );
  const totalLockedScaValue = input.parsedVeScas.reduce(
    (acc, curr) => acc + curr.lockedScaInUsd,
    0
  );
  return { totalSupplyValue, ...obligationTotals, totalLockedScaValue };
};

/* ============================================================
 *  Obligation-account helpers
 *
 *  Pure transforms lifted out of `getObligationAccount` in
 *  `src/queries/portfolioQuery.ts`. Each helper computes one
 *  responsibility — a single entry, the rewards list, or one of the
 *  estimated balances — and returns plain numbers (or an `ObligationXxx`
 *  entry) so the orchestrator can shrink to fetch + compose.
 * ============================================================ */

export type BuildObligationCollateralInput = {
  assetCoinName: string;
  coinType: string;
  symbol: string;
  coinDecimal: number;
  coinPrice: number;
  /** Wallet balance (in the smallest denomination) available to deposit. */
  coinAmount: number;
  marketCollateral: MarketCollateral;
  /** Raw on-chain `amount` field from the obligation collateral, if any. */
  depositedRawAmount?: string | number;
};

export type BuildObligationCollateralResult = {
  entry: ObligationCollateral;
  depositedValue: BigNumber;
  borrowCapacityValue: BigNumber;
  requiredCollateralValue: BigNumber;
  isDeposited: boolean;
};

export const buildObligationCollateralEntry = (
  input: BuildObligationCollateralInput
): BuildObligationCollateralResult => {
  const depositedAmount = BigNumber(input.depositedRawAmount ?? 0);
  const depositedCoin = depositedAmount.shiftedBy(-1 * input.coinDecimal);
  const depositedValue = depositedCoin.multipliedBy(input.coinPrice);
  const borrowCapacityValue = depositedValue.multipliedBy(
    input.marketCollateral.collateralFactor
  );
  const requiredCollateralValue = depositedValue.multipliedBy(
    input.marketCollateral.liquidationFactor
  );
  const availableDepositAmount = BigNumber(input.coinAmount);
  const availableDepositCoin = availableDepositAmount.shiftedBy(
    -1 * input.coinDecimal
  );
  const entry: ObligationCollateral = {
    coinName: input.assetCoinName,
    coinType: input.coinType,
    symbol: input.symbol,
    coinDecimal: input.coinDecimal,
    coinPrice: input.coinPrice,
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
  return {
    entry,
    depositedValue,
    borrowCapacityValue,
    requiredCollateralValue,
    isDeposited: depositedAmount.isGreaterThan(0),
  };
};

export type BuildBorrowIncentiveRewardsInput = {
  borrowIncentivePool: BorrowIncentivePool;
  borrowIncentiveAccount: ParsedBorrowIncentiveAccountData;
  /** Translate the on-chain account-point key to the market-coin name used
   *  by `borrowIncentivePool.points`. Injected so this helper stays pure. */
  toMarketCoinName: (key: string) => string;
};

export type BuildBorrowIncentiveRewardsResult = {
  rewards: ObligationBorrowIncentiveReward[];
  /** Whether this pool contributes a rewarded-pool count toward
   *  `totalRewardedPools`. True only when at least one of the pool's points
   *  has a finite, positive `rewardApr` AND the account has debt. */
  contributesRewardedPool: boolean;
};

const BASE_POINT_INDEX_RATE = 1_000_000_000;
const WEIGHT_SCALE = BigNumber(1_000_000_000_000);

export const buildBorrowIncentiveRewards = (
  input: BuildBorrowIncentiveRewardsInput
): BuildBorrowIncentiveRewardsResult => {
  const rewards: ObligationBorrowIncentiveReward[] = [];
  Object.entries(input.borrowIncentiveAccount.pointList).forEach(
    ([key, accountPoint]) => {
      const poolPoint =
        input.borrowIncentivePool.points[input.toMarketCoinName(key)];
      if (!accountPoint || !poolPoint) return;

      const accountBorrowedAmount = BigNumber(accountPoint.weightedAmount);
      const increasedPointRate = poolPoint.currentPointIndex
        ? Math.max(
            BigNumber(poolPoint.currentPointIndex - accountPoint.index)
              .dividedBy(BASE_POINT_INDEX_RATE)
              .toNumber(),
            0
          )
        : 1;
      const availableClaimAmount = accountBorrowedAmount
        .multipliedBy(increasedPointRate)
        .plus(accountPoint.points);
      const availableClaimCoin = availableClaimAmount.shiftedBy(
        -1 * poolPoint.coinDecimal
      );

      // veSCA boost
      const boostScale = BigNumber(poolPoint.baseWeight).dividedBy(
        WEIGHT_SCALE
      );
      const boostRatio = BigNumber(accountPoint.weightedAmount).div(
        BigNumber(input.borrowIncentiveAccount.debtAmount).multipliedBy(
          boostScale
        )
      );
      const boostValue = boostRatio.isFinite() ? boostRatio.toNumber() : 1;
      const rewardApr = isFinite(poolPoint.rewardApr) ? poolPoint.rewardApr : 0;

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
          baseRewardApr: rewardApr,
          boostedRewardApr: rewardApr * boostValue,
          maxBoost: 1 / boostScale.toNumber(),
          boostValue,
        });
      }
    }
  );

  const anyPositiveRewardApr = Object.keys(
    input.borrowIncentivePool.points
  ).some((coinName) => {
    const apr = input.borrowIncentivePool.points[coinName]?.rewardApr;
    return apr !== Infinity && typeof apr === 'number' && apr > 0;
  });
  const contributesRewardedPool =
    anyPositiveRewardApr && input.borrowIncentiveAccount.debtAmount > 0;

  return { rewards, contributesRewardedPool };
};

export type BuildObligationDebtInput = {
  assetCoinName: string;
  coinType: string;
  symbol: string;
  coinDecimal: number;
  coinPrice: number;
  /** Wallet balance (in the smallest denomination) available to repay. */
  coinAmount: number;
  marketPool: MarketPool;
  /** Raw on-chain debt fields from the obligation, if any. */
  debt?: { amount: string | number; borrowIndex?: string | number };
  /** Rewards from the matching borrow-incentive pool (already built). */
  rewards?: ObligationBorrowIncentiveReward[];
};

export type BuildObligationDebtResult = {
  entry: ObligationDebt;
  borrowedValue: BigNumber;
  borrowedValueWithWeight: BigNumber;
  isBorrowed: boolean;
};

export const buildObligationDebtEntry = (
  input: BuildObligationDebtInput
): BuildObligationDebtResult => {
  const increasedRate = input.debt?.borrowIndex
    ? input.marketPool.borrowIndex / Number(input.debt.borrowIndex) - 1
    : 0;
  const borrowedAmount = BigNumber(input.debt?.amount ?? 0).multipliedBy(
    increasedRate + 1
  );
  const borrowedCoin = borrowedAmount.shiftedBy(-1 * input.coinDecimal);

  const requiredRepayAmount = borrowedAmount;
  const requiredRepayCoin = requiredRepayAmount.shiftedBy(
    -1 * input.coinDecimal
  );

  const availableRepayAmount = BigNumber(input.coinAmount);
  const availableRepayCoin = availableRepayAmount.shiftedBy(
    -1 * input.coinDecimal
  );

  const borrowedValue = requiredRepayCoin.multipliedBy(input.coinPrice);
  const borrowedValueWithWeight = borrowedValue.multipliedBy(
    input.marketPool.borrowWeight
  );

  const entry: ObligationDebt = {
    coinName: input.assetCoinName,
    coinType: input.coinType,
    symbol: input.symbol,
    coinDecimal: input.coinDecimal,
    coinPrice: input.coinPrice,
    borrowedAmount: borrowedAmount.toNumber(),
    borrowedCoin: borrowedCoin.toNumber(),
    borrowedValue: borrowedValue.toNumber(),
    borrowedValueWithWeight: borrowedValueWithWeight.toNumber(),
    borrowIndex: Number(input.debt?.borrowIndex ?? 0),
    requiredRepayAmount: requiredRepayAmount.toNumber(),
    requiredRepayCoin: requiredRepayCoin.toNumber(),
    availableBorrowAmount: 0,
    availableBorrowCoin: 0,
    availableRepayAmount: availableRepayAmount.toNumber(),
    availableRepayCoin: availableRepayCoin.toNumber(),
    rewards: (input.rewards ?? []).filter(
      ({ weightedBorrowAmount }) => weightedBorrowAmount > 0
    ),
  };

  return {
    entry,
    borrowedValue,
    borrowedValueWithWeight,
    isBorrowed: borrowedAmount.isGreaterThan(0),
  };
};

export type ObligationSummaryInput = {
  totalDepositedValue: BigNumber;
  totalBorrowedValue: BigNumber;
  totalBorrowCapacityValue: BigNumber;
  totalBorrowedValueWithWeight: BigNumber;
  totalRequiredCollateralValue: BigNumber;
};

export type ObligationSummary = {
  riskLevel: number;
  accountBalanceValue: number;
  availableCollateralValue: number;
  requiredCollateralValue: number;
  unhealthyCollateralValue: number;
};

export const calculateObligationSummary = (
  input: ObligationSummaryInput
): ObligationSummary => {
  let risk = input.totalRequiredCollateralValue.isZero()
    ? // No collateral + non-zero debt => bad-debt situation, capped below.
      input.totalBorrowedValueWithWeight.isGreaterThan(0)
      ? BigNumber(100)
      : BigNumber(0)
    : input.totalBorrowedValueWithWeight.dividedBy(
        input.totalRequiredCollateralValue
      );
  // 100% is the safety upper bound; cap to avoid >1 risk levels showing pre-liquidation.
  risk = risk.isLessThan(1) ? risk : BigNumber(1);

  const accountBalanceValue = input.totalDepositedValue
    .minus(input.totalBorrowedValue)
    .isGreaterThan(0)
    ? input.totalDepositedValue.minus(input.totalBorrowedValue)
    : BigNumber(0);
  const availableCollateralValue = input.totalBorrowCapacityValue
    .minus(input.totalBorrowedValueWithWeight)
    .isGreaterThan(0)
    ? input.totalBorrowCapacityValue.minus(input.totalBorrowedValueWithWeight)
    : BigNumber(0);
  const requiredCollateralValue =
    input.totalBorrowedValueWithWeight.isGreaterThan(0)
      ? input.totalRequiredCollateralValue
      : BigNumber(0);
  const unhealthyCollateralValue = input.totalBorrowedValueWithWeight
    .minus(requiredCollateralValue)
    .isGreaterThan(0)
    ? input.totalBorrowedValueWithWeight.minus(requiredCollateralValue)
    : BigNumber(0);

  return {
    riskLevel: risk.toNumber(),
    accountBalanceValue: accountBalanceValue.toNumber(),
    availableCollateralValue: availableCollateralValue.toNumber(),
    requiredCollateralValue: requiredCollateralValue.toNumber(),
    unhealthyCollateralValue: unhealthyCollateralValue.toNumber(),
  };
};

export type EstimateAvailableWithdrawInput = {
  obligationCollateral: Pick<
    ObligationCollateral,
    'depositedAmount' | 'coinDecimal'
  >;
  marketCollateral: Pick<
    MarketCollateral,
    'collateralFactor' | 'coinPrice' | 'coinDecimal' | 'depositAmount'
  >;
  totalAvailableCollateralValue: number;
  totalBorrowedValueWithWeight: number;
};

export const estimateAvailableWithdrawAmount = (
  input: EstimateAvailableWithdrawInput
): { availableWithdrawAmount: number; availableWithdrawCoin: number } => {
  const baseEstimate = BigNumber(input.totalAvailableCollateralValue)
    .dividedBy(input.marketCollateral.collateralFactor)
    .dividedBy(input.marketCollateral.coinPrice)
    .shiftedBy(input.marketCollateral.coinDecimal);

  const estimated =
    input.totalBorrowedValueWithWeight === 0
      ? // No debt => no need to estimate; deposited amount is fully withdrawable.
        BigNumber(input.obligationCollateral.depositedAmount)
      : minBigNumber(
          baseEstimate
            // Cushion factor to reduce inaccurate-math failures.
            .multipliedBy(
              estimatedFactor(
                BigNumber(input.totalAvailableCollateralValue)
                  .dividedBy(input.marketCollateral.collateralFactor)
                  .toNumber(),
                3,
                'increase'
              )
            )
            .toNumber(),
          input.obligationCollateral.depositedAmount,
          input.marketCollateral.depositAmount
        );

  return {
    availableWithdrawAmount: estimated.toNumber(),
    availableWithdrawCoin: estimated
      .shiftedBy(-1 * input.obligationCollateral.coinDecimal)
      .toNumber(),
  };
};

export type EstimateAvailableBorrowInput = {
  obligationDebt: Pick<
    ObligationDebt,
    'requiredRepayAmount' | 'borrowedValue' | 'coinDecimal'
  >;
  marketPool: Pick<
    MarketPool,
    | 'borrowWeight'
    | 'coinDecimal'
    | 'coinPrice'
    | 'maxBorrowCoin'
    | 'borrowCoin'
    | 'supplyAmount'
  >;
  totalAvailableCollateralValue: number;
};

export const estimateAvailableBorrowAmount = (
  input: EstimateAvailableBorrowInput
): {
  availableBorrowAmount: number;
  availableBorrowCoin: number;
  requiredRepayAmount: number;
  requiredRepayCoin: number;
} => {
  const estimatedRequiredRepayAmount = BigNumber(
    input.obligationDebt.requiredRepayAmount
  )
    // Cushion: reduces under-repay failures from inaccurate math; the
    // contract refuses excess amounts so over-repay is safe.
    .multipliedBy(
      estimatedFactor(input.obligationDebt.borrowedValue, 3, 'decrease')
    );

  const baseEstimate = BigNumber(input.totalAvailableCollateralValue)
    .dividedBy(input.marketPool.borrowWeight)
    .shiftedBy(input.marketPool.coinDecimal)
    .dividedBy(input.marketPool.coinPrice);

  const estimated =
    input.totalAvailableCollateralValue !== 0 &&
    BigNumber(input.marketPool.maxBorrowCoin).isGreaterThan(
      input.marketPool.borrowCoin
    )
      ? minBigNumber(
          baseEstimate
            // Cushion factor to reduce inaccurate-math failures.
            .multipliedBy(
              estimatedFactor(
                baseEstimate
                  .shiftedBy(-1 * input.marketPool.coinDecimal)
                  .multipliedBy(input.marketPool.coinPrice)
                  .toNumber(),
                3,
                'increase'
              )
            )
            .toNumber(),
          input.marketPool.supplyAmount
        )
      : BigNumber(0);

  return {
    availableBorrowAmount: estimated.toNumber(),
    availableBorrowCoin: estimated
      .shiftedBy(-1 * input.obligationDebt.coinDecimal)
      .toNumber(),
    requiredRepayAmount: estimatedRequiredRepayAmount.toNumber(),
    requiredRepayCoin: estimatedRequiredRepayAmount
      .shiftedBy(-1 * input.obligationDebt.coinDecimal)
      .toNumber(),
  };
};

/**
 * Pure assembly of a single `Lending` from pre-fetched inputs. All I/O (market
 * pool, spool, stake accounts, coin/sCoin amounts, price) and name parsing are
 * resolved by the caller (`ScallopQuery.getLendings`) — this only does the math.
 */
export const buildLending = (input: {
  coinName: string;
  symbol: string;
  coinType: string;
  marketCoinType: string;
  coinDecimal: number;
  coinPrice: number;
  marketPool?: MarketPool;
  spool?: Spool;
  stakeAccounts: StakeAccount[];
  coinAmount: number;
  marketCoinAmount: number;
  sCoinAmount: number;
}): Lending => {
  const {
    coinName,
    symbol,
    coinType,
    marketCoinType,
    coinDecimal,
    coinPrice,
    marketPool,
    spool,
    stakeAccounts,
    coinAmount,
    marketCoinAmount,
    sCoinAmount,
  } = input;

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

  return {
    coinName,
    symbol,
    coinType,
    marketCoinType,
    sCoinType: marketPool?.sCoinType ?? '',
    coinDecimal,
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
};

/**
 * Pure assembly of a single `ObligationAccount` from pre-fetched inputs. All I/O
 * (market, prices, coin amounts, the obligation's on-chain collaterals/debts,
 * borrow-incentive pools + accounts) and name parsing are resolved by the caller
 * (`ScallopQuery.getObligationAccount*`) — this only does the math/assembly.
 */
export const buildObligationAccount = (input: {
  obligationId: string;
  collateralCoinNames: string[];
  market: { pools: MarketPools; collaterals: MarketCollaterals };
  coinPrices: CoinPrices;
  coinAmounts: CoinAmounts;
  obligationQuery:
    | {
        collaterals: Array<{ type: string; amount: string | number }>;
        debts: Array<{
          type: string;
          amount: string | number;
          borrowIndex: string | number;
        }>;
      }
    | null
    | undefined;
  borrowIncentivePools: Record<string, BorrowIncentivePool | undefined>;
  borrowIncentiveAccounts: Record<
    string,
    ParsedBorrowIncentiveAccountData | undefined
  >;
  utils: {
    parseCoinNameFromType: (type: string) => string;
    parseCoinType: (coinName: string) => string;
    parseSymbol: (coinName: string) => string;
    getCoinDecimal: (coinName: string) => number;
    parseSCoinTypeNameToMarketCoinName: (key: string) => string;
  };
}): ObligationAccount => {
  const {
    obligationId,
    collateralCoinNames,
    market,
    coinPrices,
    coinAmounts,
    obligationQuery,
    borrowIncentivePools,
    borrowIncentiveAccounts,
    utils,
  } = input;

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
  for (const assetCoinName of collateralCoinNames) {
    const onchainCollateral = obligationQuery?.collaterals.find(
      (collateral) =>
        utils.parseCoinNameFromType(collateral.type) === assetCoinName
    );

    const marketCollateral = market.collaterals[assetCoinName];
    if (!marketCollateral) continue;

    const built = buildObligationCollateralEntry({
      assetCoinName,
      coinType: utils.parseCoinType(assetCoinName),
      symbol: utils.parseSymbol(assetCoinName),
      coinDecimal: utils.getCoinDecimal(assetCoinName),
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
      toMarketCoinName: (key) => utils.parseSCoinTypeNameToMarketCoinName(key),
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
      (debt) => utils.parseCoinNameFromType(debt.type) === assetCoinName
    );
    const marketPool = market.pools[assetCoinName];
    if (!marketPool) continue;

    const built = buildObligationDebtEntry({
      assetCoinName,
      coinType: utils.parseCoinType(assetCoinName),
      symbol: utils.parseSymbol(assetCoinName),
      coinDecimal: utils.getCoinDecimal(assetCoinName),
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
    obligationId,
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
 * Pure assembly of the full user portfolio from already-fetched lendings,
 * obligation accounts, veScas, and prices. Composes the parse/aggregate/
 * summarise helpers above; `ScallopQuery.getUserPortfolio` only does the I/O.
 */
export const buildUserPortfolio = (input: {
  lendings: Lendings;
  obligationAccounts: ObligationAccounts;
  veScas: Array<{
    keyId: string;
    lockedScaCoin: number;
    currentVeScaBalance: number;
    unlockAt: number;
  }>;
  coinPrices: CoinPrices;
  marketPools: MarketPools;
}) => {
  const { lendings, obligationAccounts, veScas, coinPrices, marketPools } =
    input;

  const parsedLendings = parseLendingsForPortfolio(lendings);
  const parsedObligationAccounts = parseObligationAccountsForPortfolio(
    obligationAccounts,
    marketPools
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
      lendings: Object.values(pendingLendingRewards).map((value) => ({
        ...value,
        coinName: LENDING_SPOOL_REWARD_COIN_NAME,
        pendingRewardInUsd: value.coinPrice * value.pendingRewardInCoin,
      })),
      borrowIncentives: Object.entries(pendingBorrowIncentiveRewards).map(
        ([coinName, value]) => ({
          coinName,
          ...value,
          pendingRewardInUsd: value.coinPrice * value.pendingRewardInCoin,
        })
      ),
    },
    veScas: parsedVeScas,
  };
};
