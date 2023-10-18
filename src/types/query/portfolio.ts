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
  totalBalanceValue: number;
  totalBorrowCapacityValue: number;
  availableCollateralValue: number;
  totalDebtValueWithWeight: number;
  requiredCollateralValue: number;
  unhealthyCollateralValue: number;
  riskLevel: number;
  totalCollateralPools: number;
  totalDebtPools: number;
  collaterals: OptionalKeys<
    Record<
      SupportCollateralCoins,
      {
        coinName: SupportCollateralCoins;
        coinType: string;
        symbol: string;
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
