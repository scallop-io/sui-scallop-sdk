import type { MarketPool } from './core';
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
  >
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
  availableSupplyAmount: number;
  availableWithdrawAmount: number;
  availableStakeAmount: number;
  availableUnstakeAmount: number;
  availableClaimAmount: number;
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
    Record<
      SupportCollateralCoins,
      {
        coinName: SupportCollateralCoins;
        coinType: string;
        symbol: string;
        depositedAmount: number;
        depositedCoin: number;
        depositedValue: number;
        borrowCapacityValue: number;
        requiredCollateralValue: number;
        availableDepositAmount: number;
        availableDepositCoin: number;
        availableWithdrawAmount: number;
        availableWithdrawCoin: number;
      }
    >
  >;
  debts: OptionalKeys<
    Record<
      SupportPoolCoins,
      {
        coinName: SupportPoolCoins;
        coinType: string;
        symbol: string;
        borrowedAmount: number;
        borrowedCoin: number;
        borrowedValue: number;
        borrowedValueWithWeight: number;
        borrowIndex: number;
        availableBorrowAmount: number;
        availableBorrowCoin: number;
        availableRepayAmount: number;
        availableRepayCoin: number;
      }
    >
  >;
};

export type TotalValueLocked = {
  supplyValue: number;
  borrowValue: number;
  totalValue: number;
};
