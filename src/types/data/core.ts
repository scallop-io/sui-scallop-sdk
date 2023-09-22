import {
  SUPPORT_ASSET_COINS,
  SUPPORT_COLLATERAL_COINS,
  SUPPORT_ORACLES,
  SUPPORT_PACKAGES,
} from '../../constants';

export type SupportAssetCoins = (typeof SUPPORT_ASSET_COINS)[number];
export type SupportCollateralCoins = (typeof SUPPORT_COLLATERAL_COINS)[number];
export type SupportCoins = SupportAssetCoins | SupportCollateralCoins;
export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];
export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];

export interface MarketInterface {
  assets: AssetPoolInterface[];
  collaterals: CollateralPoolInterface[];
  data?: MarketDataInterface;
}

export interface MarketDataInterface {
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

export interface AssetPoolInterface {
  // The coin name
  coin: SupportAssetCoins;
  // The coin symbol of the pool, upper case.
  symbol: Uppercase<SupportAssetCoins>;
  // The unique identifier for the coin type in the pool. (e.g., "0x...::usdc::USDC")
  coinType: string;
  // The market coin type of the pool. (e.g., "0x...reserve::MarketCoin<0x...::usdc::USDC>")
  marketCoinType: string;
  // Represents the type bridged from and wrapped to.
  wrappedType?: {
    from: string;
    type: string;
  };
  // The calculated data from market query.
  calculated: AssetPoolCalculatedInterface;
  // The origin data from market query.
  origin: AssetPoolOriginInterface;
}

export interface AssetPoolCalculatedInterface {
  // The ratio of total borrowed assets to total assets in the pool, expressed as a percentage.
  utilizationRate: number;
  // The base interest rate for borrowing from the pool.
  baseBorrowRate: number;
  // The borrow interest rate for the pool
  borrowInterestRate: number;
  // The difference between borrowing and lending rates in the pool.
  supplyInterestRate: number;
  // The current growth borrow interest rate for the pool.
  currentGrowthInterest: number;
  // The current compound interest used to calculate interest rate, allowing users to predict their interest earned over a period of time.
  currentBorrowIndex: number;
  // The current total supply.
  currentTotalSupply: number;
  // The current total debt.
  currentTotalDebt: number;
  // The current total reserve.
  currentTotalReserve: number;
}

export interface AssetPoolOriginInterface {
  // The utilization rate when the pool reaches its mid kink.
  midKink: number;
  // The utilization rate when the pool reaches its high kink.
  highKink: number;
  baseBorrowRate: number;
  // The interest rate for borrowing when the pool reaches its mid kink.
  borrowRateOnMidKink: number;
  // The interest rate for borrowing when the pool reaches its high kink.
  borrowRateOnHighKink: number;
  borrowRate: number;
  // The interest rate for borrowing when the pool reaches its max kink.
  maxBorrowRate: number;
  reserveFactor: number;
  borrowWeight: number;
  borrowIndex: number;
  lastUpdated: number;
  debt: number;
  cash: number;
  marketCoinSupply: number;
  minBorrowAmount: number;
  reserve: number;
}

export interface CollateralPoolInterface {
  // The coin name
  coin: SupportCollateralCoins;
  // The coin symbol of the pool, upper case.
  symbol: Uppercase<SupportCollateralCoins>;
  // The unique identifier for the coin type in the pool. (e.g., "0x...::usdc::USDC")
  coinType: string;
  // Represents the type bridged from and wrapped to.
  wrappedType?: {
    from: string;
    type: string;
  };
  // The origin data from market query.
  origin: CollateralPoolOriginInterface;
}

export interface CollateralPoolOriginInterface {
  collateralFactor: number;
  liquidationFactor: number;
  liquidationDiscount: number;
  liquidationPanelty: number;
  liquidationReserveFactor: number;
  maxCollateralAmount: number;
  totalCollateralAmount: number;
}

export interface ObligationInterface {
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
