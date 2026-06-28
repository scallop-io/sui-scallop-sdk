type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type CoinAmounts = OptionalKeys<Record<string, number>>;
export type MarketCoinAmounts = OptionalKeys<Record<string, number>>;
export type SCoinAmounts = OptionalKeys<Record<string, number>>;

export type Obligation = { id: string; keyId: string; locked: boolean };

/**
 * The query interface for `obligation_query::obligation_data` inspectTxn.
 */
export interface ObligationQueryInterface {
  collaterals: {
    type: {
      name: string;
    };
    amount: string;
  }[];
  debts: {
    type: {
      name: string;
    };
    amount: string;
    borrowIndex: string;
  }[];
}
