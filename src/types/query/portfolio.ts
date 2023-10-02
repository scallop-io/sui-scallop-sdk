import type { MarketPool } from './core';
import type { SupportPoolCoins } from '../constant';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type Lendings = OptionalKeys<Record<SupportPoolCoins, Lending>>;

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
  suppliedCoin: number;
  suppliedValue: number;
  stakedMarketCoin: number;
  stakedCoin: number;
  stakedValue: number;
  avaliableSupplyAmount: number;
  avaliableWithdrawAmount: number;
  avaliableStakeAmount: number;
  availableUnstakeAmount: number;
  availableClaimAmount: number;
};
