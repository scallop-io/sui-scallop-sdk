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
    | 'coin'
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
  obligationId?: string;
  obligationAccount?: ObligationAccount;
  totalCollateralValue: number;
  totalDebtValue: number;
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
      SupportPoolCoins,
      {
        coinName: string;
        coinType: string;
        collateralAmount: number;
        collateralCoin: number;
        collateralValue: number;
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
      SupportCollateralCoins,
      {
        coinName: string;
        coinType: string;
        debtAmount: number;
        debtCoin: number;
        debtValue: number;
        debtValueWithWeight: number;
        borrowIndex: number;
        availableBorrowAmount: number;
        availableBorrowCoin: number;
        availableRepayAmount: number;
        availableRepayCoin: number;
      }
    >
  >;
};
