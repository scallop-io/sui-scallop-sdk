import type { MarketPool } from './core';
import type { Spool } from './spool';
import type { SupportPoolCoins, SupportCollateralCoins } from '../constant';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type Lendings = OptionalKeys<Record<SupportPoolCoins, Lending>>;
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
    | 'coinDecimal'
    | 'coinPrice'
    | 'conversionRate'
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
  collaterals: OptionalKeys<
    Record<SupportCollateralCoins, ObligationCollateral>
  >;
  debts: OptionalKeys<Record<SupportPoolCoins, ObligationDebt>>;
  borrowIncentives: OptionalKeys<
    Record<SupportPoolCoins, ObligationBorrowIncentive>
  >;
};

export type ObligationCollateral = {
  coinName: SupportCollateralCoins;
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
  coinName: SupportPoolCoins;
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

export type ObligationBorrowIncentive = {
  coinName: SupportPoolCoins;
  coinType: string;
  rewardCoinType: string;
  symbol: string;
  coinDecimal: number;
  rewardCoinDecimal: number;
  coinPrice: number;
  rewardCoinPrice: number;
  availableClaimAmount: number;
  availableClaimCoin: number;
};

export type TotalValueLocked = {
  supplyValue: number;
  borrowValue: number;
  totalValue: number;
  supplyValueChangeRatio?: number;
  borrowValueChangeRatio?: number;
  totalValueChangeRatio?: number;
};
