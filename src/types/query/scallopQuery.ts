import type {
  Market,
  MarketPools,
  MarketPool,
  MarketCollaterals,
  MarketCollateral,
  Obligation,
  MarketCoinAmounts,
  SCoinAmounts,
  CoinAmounts,
  Spools,
  StakePools,
  StakeAccounts,
  ObligationAccounts,
  BorrowIncentivePools,
  BorrowIncentiveAccounts,
} from './index';

/**
 * Interface for ScallopQuery class methods
 * This provides proper TypeScript support for all query methods
 */
export interface ScallopQueryInterface {
  // Market query methods
  queryMarket(indexer?: boolean): Promise<Market>;
  getMarketPools(
    poolCoinNames?: string[],
    args?: { indexer?: boolean }
  ): Promise<{ pools: MarketPools }>;
  getMarketPool(
    poolCoinName: string,
    args?: { indexer?: boolean }
  ): Promise<MarketPool | undefined>;
  getMarketCollaterals(
    collateralCoinNames?: string[],
    args?: { indexer?: boolean }
  ): Promise<{ collaterals: MarketCollaterals }>;
  getMarketCollateral(
    collateralCoinName: string,
    args?: { indexer?: boolean }
  ): Promise<MarketCollateral | undefined>;

  // Obligation methods
  getObligations(ownerAddress?: string): Promise<Obligation[]>;
  queryObligation(obligationId: string): Promise<Obligation>;
  getObligationAccounts(ownerAddress?: string): Promise<ObligationAccounts>;

  // Coin amount methods
  getCoinAmounts(
    coinNames?: string[],
    ownerAddress?: string
  ): Promise<CoinAmounts>;
  getCoinAmount(coinName: string, ownerAddress?: string): Promise<number>;
  getMarketCoinAmounts(
    marketCoinNames?: string[],
    ownerAddress?: string
  ): Promise<MarketCoinAmounts>;
  getMarketCoinAmount(
    marketCoinName: string,
    ownerAddress?: string
  ): Promise<number>;
  getSCoinAmounts(
    sCoinNames?: string[],
    ownerAddress?: string
  ): Promise<SCoinAmounts>;
  getSCoinAmount(sCoinName: string, ownerAddress?: string): Promise<number>;

  // Spool methods
  getSpools(indexer?: boolean): Promise<{ spools: Spools }>;
  getSpool(
    poolCoinName: string,
    indexer?: boolean
  ): Promise<Spools[string] | undefined>;
  getStakePools(poolCoinNames?: string[]): Promise<StakePools>;
  getStakePool(poolCoinName: string): Promise<StakePools[string] | undefined>;
  getStakeAccounts(
    stakeMarketCoinNames?: string[],
    ownerAddress?: string
  ): Promise<StakeAccounts>;
  getStakeAccount(
    stakeMarketCoinName: string,
    ownerAddress?: string
  ): Promise<StakeAccounts[string] | undefined>;

  // Borrow incentive methods
  getBorrowIncentivePools(
    indexer?: boolean
  ): Promise<{ pools: BorrowIncentivePools }>;
  getBorrowIncentiveAccounts(
    obligationId: string,
    poolCoinNames?: string[],
    indexer?: boolean
  ): Promise<BorrowIncentiveAccounts>;

  // Indexer property (for accessing getMarket)
  indexer: {
    getMarket(): Promise<Pick<Market, 'pools' | 'collaterals'>>;
    // Add other indexer methods as needed
  };
}
