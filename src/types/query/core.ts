import type {
  SupportPoolCoins,
  SupportCollateralCoins,
  CoinWrappedType,
} from '../constant';

export type Obligation = { id: string; keyId: string };

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type MarketPools = OptionalKeys<Record<SupportPoolCoins, MarketPool>>;
export type MarketCollaterals = OptionalKeys<
  Record<SupportCollateralCoins, MarketCollateral>
>;
export type Coins = OptionalKeys<Record<SupportPoolCoins, number>>;
export type MarketCoins = OptionalKeys<Record<SupportPoolCoins, number>>;

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
  coin: SupportPoolCoins;
  symbol: Uppercase<SupportPoolCoins>;
  coinType: string;
  marketCoinType: string;
  coinWrappedType: CoinWrappedType;
  decimal: number;
} & CalculatedMarketPoolData;

export type MarketCollateral = {
  coin: SupportPoolCoins;
  symbol: Uppercase<SupportPoolCoins>;
  coinType: string;
  marketCoinType: string;
  coinWrappedType: CoinWrappedType;
  decimal: number;
} & ParsedMarketCollateralData;

export type OriginMarketPoolData = {
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
  baseBorrowRatePerSec: { value: string };
  borrowRateOnHighKink: { value: string };
  borrowRateOnMidKink: { value: string };
  highKink: { value: string };
  midKink: { value: string };
  minBorrowAmount: string;
};

export type ParsedMarketPoolData = {
  maxBorrowRate: number;
  borrowRate: number;
  borrowRateScale: number;
  borrowIndex: number;
  lastUpdated: number;
  cash: number;
  debt: number;
  marketCoinSupply: number;
  reserve: number;
  reserveFactor: number;
  borrowWeight: number;
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
  totalSupply: number;
  totalBorrow: number;
  totalReserve: number;
  utilizationRate: number;
  supplyApr: number;
  supplyApy: number;
  conversionRate: number;
};

export type OriginMarketCollateralData = {
  collateralFactor: { value: string };
  liquidationFactor: { value: string };
  liquidationDiscount: { value: string };
  liquidationPanelty: { value: string };
  liquidationReserveFactor: { value: string };
  maxCollateralAmount: string;
  totalCollateralAmount: string;
};

export type ParsedMarketCollateralData = {
  collateralFactor: number;
  liquidationFactor: number;
  liquidationDiscount: number;
  liquidationPanelty: number;
  liquidationReserveFactor: number;
  maxCollateralAmount: number;
  totalCollateralAmount: number;
};

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
    type: {
      name: string;
    };
  }[];
}

export type Market = {
  pools: MarketPool[];
  collaterals: MarketCollateral[];
  data?: MarketQueryInterface;
};

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
