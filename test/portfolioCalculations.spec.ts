import { BigNumber } from 'bignumber.js';
import {
  aggregatePendingBorrowIncentiveRewards,
  aggregatePendingLendingRewards,
  buildBorrowIncentiveRewards,
  buildObligationCollateralEntry,
  buildObligationDebtEntry,
  calculateObligationSummary,
  estimateAvailableBorrowAmount,
  estimateAvailableWithdrawAmount,
  parseLendingsForPortfolio,
  parseObligationAccountsForPortfolio,
  parseVeScasForPortfolio,
  summarisePortfolioTotals,
} from 'src/services/index.js';
import type { Lendings, ObligationAccounts } from 'src/types/index.js';
import { describe, expect, it } from 'vitest';

describe('portfolio calculations', () => {
  it('parseLendingsForPortfolio filters zero-balance entries and normalises non-finite incentiveApr', () => {
    const lendings = {
      sui: {
        coinName: 'sui',
        symbol: 'SUI',
        coinType: '0x2::sui::SUI',
        coinPrice: 2,
        coinDecimal: 9,
        availableWithdrawCoin: 5,
        availableUnstakeCoin: 1,
        suppliedValue: 10,
        supplyApr: 0.1,
        supplyApy: 0.105,
        rewardApr: Infinity,
        availableClaimCoin: 0,
      },
      usdc: {
        coinName: 'usdc',
        symbol: 'USDC',
        coinType: '0x..usdc',
        coinPrice: 1,
        coinDecimal: 6,
        availableWithdrawCoin: 0,
        availableUnstakeCoin: 0,
        suppliedValue: 0,
        supplyApr: 0,
        supplyApy: 0,
        rewardApr: 0,
        availableClaimCoin: 0,
      },
    } as unknown as Lendings;

    const result = parseLendingsForPortfolio(lendings);
    expect(result.length).toBe(1);
    expect(result[0].coinName).toBe('sui');
    expect(result[0].incentiveApr).toBe(0);
  });

  it('parseObligationAccountsForPortfolio keeps only obligations with debt/collateral and reads APR from marketPools', () => {
    const obligationAccounts = {
      a: {
        obligationId: '0xa',
        totalBorrowedValueWithWeight: 5,
        totalDepositedValue: 10,
        totalRiskLevel: 0.4,
        totalAvailableCollateralValue: 3,
        totalUnhealthyCollateralValue: 0,
        collaterals: {
          sui: {
            coinName: 'sui',
            symbol: 'SUI',
            coinDecimal: 9,
            coinType: '0x2::sui::SUI',
            coinPrice: 2,
            depositedCoin: 5,
            depositedValue: 10,
          },
        },
        debts: {
          sui: {
            coinName: 'sui',
            symbol: 'SUI',
            coinDecimal: 9,
            coinType: '0x2::sui::SUI',
            coinPrice: 2,
            borrowedCoin: 2,
            borrowedValueWithWeight: 5,
          },
        },
        borrowIncentives: {},
      },
      empty: {
        obligationId: '0xempty',
        totalBorrowedValueWithWeight: 0,
        totalDepositedValue: 0,
        totalRiskLevel: 0,
        totalAvailableCollateralValue: 0,
        totalUnhealthyCollateralValue: 0,
        collaterals: {},
        debts: {},
        borrowIncentives: {},
      },
    } as unknown as ObligationAccounts;

    const result = parseObligationAccountsForPortfolio(obligationAccounts, {
      sui: { borrowApr: 0.07, borrowApy: 0.0725 } as never,
    });
    expect(result.length).toBe(1);
    expect(result[0].obligationId).toBe('0xa');
    expect(result[0].borrowedPools[0].borrowApr).toBe(0.07);
  });

  it('aggregatePendingLendingRewards rolls SUI spool rewards into a single bucket', () => {
    const lendings = {
      a: { availableClaimCoin: 3, availableWithdrawCoin: 1 } as never,
      b: { availableClaimCoin: 5, availableWithdrawCoin: 1 } as never,
      zero: { availableClaimCoin: 0, availableWithdrawCoin: 1 } as never,
    } as unknown as Lendings;
    const result = aggregatePendingLendingRewards(lendings, { sui: 2 });
    expect(result.sui).toBeDefined();
    expect(result.sui.pendingRewardInCoin).toBe(8);
    expect(result.sui.coinPrice).toBe(2);
    expect(result.sui.symbol).toBe('SUI');
  });

  it('aggregatePendingBorrowIncentiveRewards groups rewards by coinName', () => {
    const obligationAccounts = {
      a: {
        borrowIncentives: {
          sui: {
            rewards: [
              {
                coinName: 'sca',
                symbol: 'SCA',
                coinType: '0x..sca',
                coinPrice: 1,
                availableClaimCoin: 4,
              },
            ],
          },
        },
      },
      b: {
        borrowIncentives: {
          sui: {
            rewards: [
              {
                coinName: 'sca',
                symbol: 'SCA',
                coinType: '0x..sca',
                coinPrice: 1,
                availableClaimCoin: 6,
              },
            ],
          },
        },
      },
    } as unknown as ObligationAccounts;

    const result = aggregatePendingBorrowIncentiveRewards(obligationAccounts);
    expect(result.sca.pendingRewardInCoin).toBe(10);
  });

  it('parseVeScasForPortfolio computes USD value and remaining lock days', () => {
    const now = 1_700_000_000_000;
    const oneDayMs = 86_400_000;
    const veScas = [
      {
        keyId: '0xkey',
        lockedScaCoin: 100,
        currentVeScaBalance: 50,
        unlockAt: now + 7 * oneDayMs,
      },
      {
        keyId: '0xexpired',
        lockedScaCoin: 25,
        currentVeScaBalance: 0,
        unlockAt: now - oneDayMs,
      },
    ];
    const result = parseVeScasForPortfolio(veScas, 0.5, now);
    expect(result[0].lockedScaInUsd).toBe(50);
    expect(result[0].remainingLockPeriodInDays).toBe(7);
    expect(result[1].remainingLockPeriodInDays).toBe(0);
  });

  it('summarisePortfolioTotals sums supplied / debt / collateral / locked SCA', () => {
    const totals = summarisePortfolioTotals({
      parsedLendings: [
        { suppliedValue: 10 } as never,
        { suppliedValue: 20 } as never,
      ],
      parsedObligationAccounts: [
        { totalDebtsInUsd: 4, totalCollateralInUsd: 8 } as never,
        { totalDebtsInUsd: 1, totalCollateralInUsd: 2 } as never,
      ],
      parsedVeScas: [
        { lockedScaInUsd: 7 } as never,
        { lockedScaInUsd: 3 } as never,
      ],
    });
    expect(totals).toEqual({
      totalSupplyValue: 30,
      totalDebtValue: 5,
      totalCollateralValue: 10,
      totalLockedScaValue: 10,
    });
  });

  it('buildObligationCollateralEntry computes deposited value, capacity, required collateral', () => {
    const r = buildObligationCollateralEntry({
      assetCoinName: 'sui',
      coinType: '0x2::sui::SUI',
      symbol: 'SUI',
      coinDecimal: 9,
      coinPrice: 2,
      coinAmount: 1_000_000_000, // 1 SUI in wallet
      marketCollateral: {
        collateralFactor: 0.8,
        liquidationFactor: 0.9,
      } as never,
      depositedRawAmount: '5000000000', // 5 SUI on-chain
    });
    expect(r.entry.depositedAmount).toBe(5_000_000_000);
    expect(r.entry.depositedCoin).toBe(5);
    expect(r.entry.depositedValue).toBe(10);
    expect(r.entry.borrowCapacityValue).toBe(8);
    expect(r.entry.requiredCollateralValue).toBe(9);
    expect(r.entry.availableDepositCoin).toBe(1);
    expect(r.isDeposited).toBe(true);
    expect(r.entry.availableWithdrawAmount).toBe(0); // filled in by the second pass
  });

  it('buildObligationCollateralEntry handles zero deposit', () => {
    const r = buildObligationCollateralEntry({
      assetCoinName: 'sui',
      coinType: '0x2::sui::SUI',
      symbol: 'SUI',
      coinDecimal: 9,
      coinPrice: 2,
      coinAmount: 0,
      marketCollateral: {
        collateralFactor: 0.8,
        liquidationFactor: 0.9,
      } as never,
      depositedRawAmount: undefined,
    });
    expect(r.entry.depositedAmount).toBe(0);
    expect(r.isDeposited).toBe(false);
  });

  it('buildObligationDebtEntry applies the borrow-index growth + borrow weight', () => {
    const r = buildObligationDebtEntry({
      assetCoinName: 'sui',
      coinType: '0x2::sui::SUI',
      symbol: 'SUI',
      coinDecimal: 9,
      coinPrice: 2,
      coinAmount: 500_000_000,
      marketPool: { borrowIndex: 110, borrowWeight: 1.25 } as never,
      // borrowed 4 SUI (raw); pool index grew from 100 → 110, so +10% interest
      debt: { amount: '4000000000', borrowIndex: 100 },
      rewards: [
        // included reward
        { weightedBorrowAmount: 1, coinName: 'sca' } as never,
        // filtered out
        { weightedBorrowAmount: 0, coinName: 'zero' } as never,
      ],
    });
    // borrowedAmount = 4e9 * 1.1 = 4.4e9
    expect(r.entry.borrowedAmount).toBeCloseTo(4_400_000_000);
    expect(r.entry.borrowedCoin).toBeCloseTo(4.4);
    expect(r.entry.borrowedValue).toBeCloseTo(8.8);
    expect(r.entry.borrowedValueWithWeight).toBeCloseTo(11);
    expect(r.entry.rewards.length).toBe(1);
    expect(r.isBorrowed).toBe(true);
  });

  it('buildBorrowIncentiveRewards rolls up account points + boost', () => {
    const r = buildBorrowIncentiveRewards({
      borrowIncentivePool: {
        coinName: 'sui',
        coinType: '0x..sui',
        symbol: 'SUI',
        coinDecimal: 9,
        coinPrice: 2,
        points: {
          ssca: {
            coinName: 'sca',
            coinType: '0x..sca',
            symbol: 'SCA',
            coinDecimal: 9,
            coinPrice: 1,
            currentPointIndex: 1_000_000_000 + 500_000_000, // delta = 0.5
            baseWeight: 1_000_000_000_000, // boostScale = 1
            rewardApr: 0.1,
          } as never,
          szero: { rewardApr: 0 } as never,
        },
      } as never,
      borrowIncentiveAccount: {
        debtAmount: 4,
        pointList: {
          ssca: { weightedAmount: 4, points: 1, index: 1_000_000_000 } as never,
        },
      } as never,
      toMarketCoinName: (key) => key,
    });
    expect(r.rewards.length).toBe(1);
    const reward = r.rewards[0];
    expect(reward.coinName).toBe('sca');
    // weightedAmount(4) * 0.5 + points(1) = 3
    expect(reward.availableClaimAmount).toBeCloseTo(3);
    // boostValue = 4 / (4 * 1) = 1
    expect(reward.boostValue).toBeCloseTo(1);
    expect(reward.baseRewardApr).toBe(0.1);
    expect(r.contributesRewardedPool).toBe(true);
  });

  it('buildBorrowIncentiveRewards returns contributesRewardedPool=false when no debt', () => {
    const r = buildBorrowIncentiveRewards({
      borrowIncentivePool: {
        points: {
          ssca: { rewardApr: 0.1 } as never,
        },
      } as never,
      borrowIncentiveAccount: {
        debtAmount: 0,
        pointList: {},
      } as never,
      toMarketCoinName: (key) => key,
    });
    expect(r.contributesRewardedPool).toBe(false);
  });

  it('calculateObligationSummary caps risk at 1 and zeros out unhealthy collateral when overcollateralised', () => {
    const result = calculateObligationSummary({
      totalDepositedValue: BigNumber(100),
      totalBorrowedValue: BigNumber(20),
      totalBorrowCapacityValue: BigNumber(80),
      totalBorrowedValueWithWeight: BigNumber(25),
      totalRequiredCollateralValue: BigNumber(50),
    });
    expect(result.riskLevel).toBeCloseTo(0.5);
    expect(result.accountBalanceValue).toBe(80);
    expect(result.availableCollateralValue).toBe(55);
    expect(result.requiredCollateralValue).toBe(50);
    expect(result.unhealthyCollateralValue).toBe(0);
  });

  it('calculateObligationSummary surfaces bad-debt as risk=1 when no collateral remains', () => {
    const result = calculateObligationSummary({
      totalDepositedValue: BigNumber(0),
      totalBorrowedValue: BigNumber(5),
      totalBorrowCapacityValue: BigNumber(0),
      totalBorrowedValueWithWeight: BigNumber(5),
      totalRequiredCollateralValue: BigNumber(0),
    });
    expect(result.riskLevel).toBe(1);
    expect(result.unhealthyCollateralValue).toBe(5);
  });

  it('estimateAvailableWithdrawAmount returns deposited when there is no debt', () => {
    const result = estimateAvailableWithdrawAmount({
      obligationCollateral: { depositedAmount: 7_000_000_000, coinDecimal: 9 },
      marketCollateral: {
        collateralFactor: 0.8,
        coinPrice: 2,
        coinDecimal: 9,
        depositAmount: 100_000_000_000,
      } as never,
      totalAvailableCollateralValue: 0,
      totalBorrowedValueWithWeight: 0,
    });
    expect(result.availableWithdrawAmount).toBe(7_000_000_000);
    expect(result.availableWithdrawCoin).toBe(7);
  });

  it('estimateAvailableBorrowAmount returns zero when there is no available collateral', () => {
    const result = estimateAvailableBorrowAmount({
      obligationDebt: {
        requiredRepayAmount: 1_000_000_000,
        borrowedValue: 2,
        coinDecimal: 9,
      },
      marketPool: {
        borrowWeight: 1,
        coinDecimal: 9,
        coinPrice: 2,
        maxBorrowCoin: 1_000_000,
        borrowCoin: 0,
        supplyAmount: 1_000_000_000_000,
      } as never,
      totalAvailableCollateralValue: 0,
    });
    expect(result.availableBorrowAmount).toBe(0);
    // requiredRepay still applies the overshoot cushion to avoid under-repay
    // (the contract refuses excess so over-shooting is safe).
    expect(result.requiredRepayAmount).toBeGreaterThan(1_000_000_000);
  });
});
