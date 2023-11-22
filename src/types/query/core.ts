import type {
  SupportPoolCoins,
  SupportCollateralCoins,
  SupportMarketCoins,
  CoinWrappedType,
} from '../constant';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type MarketPools = OptionalKeys<Record<SupportPoolCoins, MarketPool>>;
export type MarketCollaterals = OptionalKeys<
  Record<SupportCollateralCoins, MarketCollateral>
>;
export type CoinAmounts = OptionalKeys<Record<SupportPoolCoins, number>>;
export type MarketCoinAmounts = OptionalKeys<
  Record<SupportMarketCoins, number>
>;

export type BalanceSheet = {
  cash: string;
  debt: string;
  market_coin_supply: string;
  revenue: string;
};

export type BorrowIndex = {
  borrow_index: string;
  interest_rate: {
    fields: {
      value: string;
    };
  };
  interest_rate_scale: string;
  last_updated: string;
};

export type InterestModel = {
  base_borrow_rate_per_sec: {
    fields: {
      value: string;
    };
  };
  borrow_rate_on_high_kink: {
    fields: {
      value: string;
    };
  };
  borrow_rate_on_mid_kink: {
    fields: {
      value: string;
    };
  };
  borrow_weight: {
    fields: {
      value: string;
    };
  };
  borrow_fee_rate: {
    fields: {
      value: string;
    };
  };
  high_kink: {
    fields: {
      value: string;
    };
  };
  interest_rate_scale: string;
  max_borrow_rate: {
    fields: {
      value: string;
    };
  };
  mid_kink: {
    fields: {
      value: string;
    };
  };
  min_borrow_amount: string;
  revenue_factor: {
    fields: {
      value: string;
    };
  };
  type: {
    fields: {
      name: string;
    };
  };
};

export type RiskModel = {
  collateral_factor: {
    fields: { value: string };
  };
  liquidation_discount: {
    fields: { value: string };
  };
  liquidation_factor: {
    fields: { value: string };
  };
  liquidation_penalty: {
    fields: { value: string };
  };
  liquidation_revenue_factor: {
    fields: { value: string };
  };
  max_collateral_amount: string;
  type: {
    fields: {
      name: string;
    };
  };
};

export type CollateralStat = { amount: string };

export type MarketPool = {
  coinName: SupportPoolCoins;
  symbol: string;
  coinType: string;
  marketCoinType: string;
  coinWrappedType: CoinWrappedType;
  coinDecimal: number;
  coinPrice: number;
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
  coinName: SupportCollateralCoins;
  symbol: string;
  coinType: string;
  marketCoinType: string;
  coinWrappedType: CoinWrappedType;
  coinDecimal: number;
  coinPrice: number;
} & Required<
  Pick<
    ParsedMarketCollateralData,
    | 'collateralFactor'
    | 'liquidationFactor'
    | 'liquidationDiscount'
    | 'liquidationPanelty'
    | 'liquidationReserveFactor'
  >
> &
  CalculatedMarketCollateralData;

export type OriginMarketPoolData = {
  type: { name: string };
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
};

export type CalculatedMarketPoolData = {
  baseBorrowApr: number;
  baseBorrowApy: number;
  borrowAprOnHighKink: number;
  borrowApyOnHighKink: number;
  borrowAprOnMidKink: number;
  borrowApyOnMidKink: number;
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
  conversionRate: number;
};

export type OriginMarketCollateralData = {
  type: { name: string };
  collateralFactor: { value: string };
  liquidationFactor: { value: string };
  liquidationDiscount: { value: string };
  liquidationPanelty: { value: string };
  liquidationReserveFactor: { value: string };
  maxCollateralAmount: string;
  totalCollateralAmount: string;
};

export type ParsedMarketCollateralData = {
  coinType: string;
  collateralFactor: number;
  liquidationFactor: number;
  liquidationDiscount: number;
  liquidationPanelty: number;
  liquidationReserveFactor: number;
  maxCollateralAmount: number;
  totalCollateralAmount: number;
};

export type CalculatedMarketCollateralData = {
  maxDepositAmount: number;
  maxDepositCoin: number;
  depositAmount: number;
  depositCoin: number;
};

export type Market = {
  pools: MarketPools;
  collaterals: MarketCollaterals;
  data?: MarketQueryInterface;
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
