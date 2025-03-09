import type { MarketPool } from './core';
import type { Spool } from './spool';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type Lendings = OptionalKeys<Record<string, Lending>>;
export type ObligationAccounts = OptionalKeys<
  Record<string, ObligationAccount>
>;

export type Lending = Required<
  Pick<
    MarketPool,
    | 'coinName'
    | 'symbol'
    | 'coinType'
    | 'marketCoinType'
    | 'sCoinType'
    | 'coinDecimal'
    | 'coinPrice'
    | 'conversionRate'
    | 'isIsolated'
  > &
    Pick<Spool, 'marketCoinPrice'>
> & {
  supplyApr: number;
  supplyApy: number;
  rewardApr: number;
  suppliedAmount: number;
  suppliedCoin: number;
  suppliedValue: number;
  stakedMarketAmount: number;
  stakedMarketCoin: number;
  stakedAmount: number;
  stakedCoin: number;
  stakedValue: number;
  unstakedMarketAmount: number;
  unstakedMarketCoin: number;
  unstakedAmount: number;
  unstakedCoin: number;
  unstakedValue: number;
  availableSupplyAmount: number;
  availableSupplyCoin: number;
  availableWithdrawAmount: number;
  availableWithdrawCoin: number;
  availableStakeAmount: number;
  availableStakeCoin: number;
  availableUnstakeAmount: number;
  availableUnstakeCoin: number;
  availableClaimAmount: number;
  availableClaimCoin: number;
};

export type ObligationAccount = {
  obligationId: string;
  totalDepositedValue: number;
  totalBorrowedValue: number;
  totalBalanceValue: number;
  totalBorrowCapacityValue: number;
  totalAvailableCollateralValue: number;
  totalBorrowedValueWithWeight: number;
  totalRequiredCollateralValue: number;
  totalUnhealthyCollateralValue: number;
  totalRiskLevel: number;
  totalDepositedPools: number;
  totalBorrowedPools: number;
  totalRewardedPools: number;
  collaterals: OptionalKeys<Record<string, ObligationCollateral>>;
  debts: OptionalKeys<Record<string, ObligationDebt>>;
  borrowIncentives: OptionalKeys<Record<string, ObligationBorrowIncentive>>;
};

export type ObligationCollateral = {
  coinName: string;
  coinType: string;
  symbol: string;
  coinDecimal: number;
  coinPrice: number;
  depositedAmount: number;
  depositedCoin: number;
  depositedValue: number;
  borrowCapacityValue: number;
  requiredCollateralValue: number;
  availableDepositAmount: number;
  availableDepositCoin: number;
  availableWithdrawAmount: number;
  availableWithdrawCoin: number;
};

export type ObligationDebt = {
  coinName: string;
  coinType: string;
  symbol: string;
  coinDecimal: number;
  coinPrice: number;
  borrowedAmount: number;
  borrowedCoin: number;
  borrowedValue: number;
  borrowedValueWithWeight: number;
  borrowIndex: number;
  requiredRepayAmount: number;
  requiredRepayCoin: number;
  availableBorrowAmount: number;
  availableBorrowCoin: number;
  availableRepayAmount: number;
  availableRepayCoin: number;
};

export type ObligationBorrowIcentiveReward = {
  coinName: string;
  coinType: string;
  symbol: string;
  coinDecimal: number;
  coinPrice: number;
  availableClaimCoin: number;
  availableClaimAmount: number;
  boostValue: number;
};

export type ObligationBorrowIncentive = {
  coinName: string;
  coinType: string;
  symbol: string;
  coinDecimal: number;
  coinPrice: number;
  rewards: ObligationBorrowIcentiveReward[];
};

export type TotalValueLocked = {
  supplyLendingValue: number;
  supplyCollateralValue: number;
  supplyValue: number;
  borrowValue: number;
  totalValue: number;
  supplyValueChangeRatio?: number;
  supplyLendingValueChangeRatio?: number;
  supplyCollateralValueChangeRatio?: number;
  borrowValueChangeRatio?: number;
  totalValueChangeRatio?: number;
};
