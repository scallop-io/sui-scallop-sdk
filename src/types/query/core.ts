import type { CoinWrappedType } from '../constant/index.js';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type MarketPools = OptionalKeys<Record<string, MarketPool>>;
export type MarketCollaterals = OptionalKeys<Record<string, MarketCollateral>>;
export type CoinAmounts = OptionalKeys<Record<string, number>>;
export type MarketCoinAmounts = OptionalKeys<Record<string, number>>;

export type SCoinAmounts = OptionalKeys<Record<string, number>>;

export type BalanceSheet = {
  cash: string;
  debt: string;
  market_coin_supply: string;
  revenue: string;
};

export type BorrowDynamic = {
  borrow_index: string;
  interest_rate: {
    value: string;
  };
  interest_rate_scale: string;
  last_updated: string;
};

export type BorrowFee = { value: string };

export type InterestModel = {
  base_borrow_rate_per_sec: {
    value: string;
  };
  borrow_rate_on_high_kink: {
    value: string;
  };
  borrow_rate_on_mid_kink: {
    value: string;
  };
  borrow_weight: {
    value: string;
  };
  borrow_fee_rate: {
    value: string;
  };
  high_kink: {
    value: string;
  };
  interest_rate_scale: string;
  max_borrow_rate: {
    value: string;
  };
  mid_kink: {
    value: string;
  };
  min_borrow_amount: string;
  revenue_factor: {
    value: string;
  };
  type: string;
};

export type RiskModel = {
  collateral_factor: {
    value: string;
  };
  liquidation_discount: {
    value: string;
  };
  liquidation_factor: {
    value: string;
  };
  liquidation_penalty: {
    value: string;
  };
  liquidation_revenue_factor: {
    value: string;
  };
  max_collateral_amount: string;
  type: string;
};

export type CollateralStat = { amount: string };

export type MarketPool = {
  coinName: string;
  symbol: string;
  coinType: string;
  marketCoinType: string;
  sCoinType: string;
  coinWrappedType: CoinWrappedType;
  coinDecimal: number;
  coinPrice: number;
  maxSupplyCoin: number;
  maxBorrowCoin: number;
  isIsolated: boolean;
} & Required<
  Pick<
    ParsedMarketPoolData,
    | 'highKink'
    | 'midKink'
    | 'reserveFactor'
    | 'borrowWeight'
    | 'borrowFee'
    | 'marketCoinSupplyAmount'
    | 'minBorrowAmount'
  >
> &
  CalculatedMarketPoolData;

export type MarketCollateral = {
  coinName: string;
  symbol: string;
  coinType: string;
  marketCoinType: string;
  coinWrappedType: CoinWrappedType;
  coinDecimal: number;
  coinPrice: number;
  isIsolated: boolean;
} & Required<
  Pick<
    ParsedMarketCollateralData,
    | 'collateralFactor'
    | 'liquidationFactor'
    | 'liquidationDiscount'
    | 'liquidationPenalty'
    | 'liquidationReserveFactor'
  >
> &
  CalculatedMarketCollateralData;

export type OriginMarketPoolData = {
  type: string;
  maxBorrowRate: { value: string };
  interestRate: { value: string };
  interestRateScale: string;
  borrowIndex: string;
  lastUpdated: string;
  cash: string;
  debt: string;
  marketCoinSupply: string;
  reserve: string;
  reserveFactor: { value: string };
  borrowWeight: { value: string };
  borrowFeeRate: { value: string };
  baseBorrowRatePerSec: { value: string };
  borrowRateOnHighKink: { value: string };
  borrowRateOnMidKink: { value: string };
  highKink: { value: string };
  midKink: { value: string };
  minBorrowAmount: string;
  isIsolated: boolean;
  supplyLimit: string;
  borrowLimit: string;
};

export type ParsedMarketPoolData = {
  coinType: string;
  maxBorrowRate: number;
  borrowRate: number;
  borrowRateScale: number;
  borrowIndex: number;
  lastUpdated: number;
  cashAmount: number;
  debtAmount: number;
  marketCoinSupplyAmount: number;
  reserveAmount: number;
  reserveFactor: number;
  borrowWeight: number;
  borrowFee: number;
  baseBorrowRate: number;
  borrowRateOnHighKink: number;
  borrowRateOnMidKink: number;
  highKink: number;
  midKink: number;
  minBorrowAmount: number;
  isIsolated: boolean;
  supplyLimit: number;
  borrowLimit: number;
};

export type CalculatedMarketPoolData = {
  baseBorrowApr: number;
  baseBorrowApy: number;
  borrowAprOnHighKink: number;
  borrowApyOnHighKink: number;
  borrowAprOnMidKink: number;
  borrowApyOnMidKink: number;
  coinDecimal: number;
  conversionRate: number;
  maxBorrowApr: number;
  maxBorrowApy: number;
  borrowApr: number;
  borrowApy: number;
  borrowIndex: number;
  growthInterest: number;
  supplyAmount: number;
  supplyCoin: number;
  borrowAmount: number;
  borrowCoin: number;
  reserveAmount: number;
  reserveCoin: number;
  utilizationRate: number;
  supplyApr: number;
  supplyApy: number;
  isIsolated: boolean;
  maxSupplyCoin: number;
  maxBorrowCoin: number;
};

export type OriginMarketCollateralData = {
  type: string;
  isIsolated: boolean;
  collateralFactor: { value: string };
  liquidationFactor: { value: string };
  liquidationDiscount: { value: string };
  liquidationPenalty: { value: string };
  liquidationReserveFactor: { value: string };
  maxCollateralAmount: string;
  totalCollateralAmount: string;
};

export type ParsedMarketCollateralData = {
  coinType: string;
  collateralFactor: number;
  liquidationFactor: number;
  liquidationDiscount: number;
  liquidationPenalty: number;
  liquidationReserveFactor: number;
  maxCollateralAmount: number;
  totalCollateralAmount: number;
  isIsolated: boolean;
};

export type CalculatedMarketCollateralData = {
  coinDecimal: number;
  isIsolated: boolean;
  maxDepositAmount: number;
  maxDepositCoin: number;
  depositAmount: number;
  depositCoin: number;
};

export type Markets = {
  pools: MarketPools;
  collaterals: MarketCollaterals;
  // data?: MarketQueryInterface;
};

export type Market = {
  pool: MarketPool;
  collateral: MarketCollateral | undefined;
};

export type Obligation = { id: string; keyId: string; locked: boolean };

/**
 * The query interface for `market_query::market_data` inspectTxn.
 */
export interface MarketQueryInterface {
  collaterals: {
    collateralFactor: {
      value: string;
    };
    liquidationDiscount: {
      value: string;
    };
    liquidationFactor: {
      value: string;
    };
    // liquidationPenalty: {
    //   value: string;
    // };
    liquidationPanelty: {
      value: string;
    };
    liquidationReserveFactor: {
      value: string;
    };
    maxCollateralAmount: string;
    totalCollateralAmount: string;
    type: {
      name: string;
    };
  }[];
  pools: {
    baseBorrowRatePerSec: {
      value: string;
    };
    borrowRateOnHighKink: {
      value: string;
    };
    borrowRateOnMidKink: {
      value: string;
    };
    maxBorrowRate: {
      value: string;
    };
    highKink: {
      value: string;
    };
    midKink: {
      value: string;
    };
    interestRate: {
      value: string;
    };
    interestRateScale: string;
    borrowIndex: string;
    lastUpdated: string;
    cash: string;
    debt: string;
    marketCoinSupply: string;
    minBorrowAmount: string;
    reserve: string;
    reserveFactor: {
      value: string;
    };
    borrowWeight: {
      value: string;
    };
    borrowFeeRate: {
      value: string;
    };
    type: {
      name: string;
    };
  }[];
}

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
