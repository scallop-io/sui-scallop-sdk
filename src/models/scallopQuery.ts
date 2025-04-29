import ScallopUtils, { ScallopUtilsParams } from './scallopUtils';
import ScallopIndexer, { ScallopIndexerParams } from './scallopIndexer';
import { withIndexerFallback } from 'src/utils';
import {
  CoinPrices,
  MarketCollaterals,
  MarketPool,
  MarketPools,
  StakePools,
  StakeRewardPools,
  SupportOracleType,
  xOracleRules,
} from 'src/types';
import {
  getAllCoinPrices,
  getAssetOracles,
  getBindedObligationId,
  getBindedVeScaKey,
  getBorrowIncentivePools,
  getBorrowLimit,
  getCoinAmount,
  getCoinAmounts,
  getFlashLoanFees,
  getIsolatedAssets,
  getLending,
  getLendings,
  getLoyaltyProgramInformations,
  getMarketCoinAmount,
  getMarketCoinAmounts,
  getMarketCollateral,
  getMarketCollaterals,
  getMarketPools,
  getObligationAccounts,
  getObligations,
  getOnDemandAggObjectIds,
  getPoolAddresses,
  getPriceUpdatePolicies,
  getPythPrice,
  getPythPrices,
  getSCoinAmount,
  getSCoinAmounts,
  getSCoinSwapRate,
  getSCoinTotalSupply,
  getSpools,
  getStakeAccounts,
  getStakePool,
  getStakeRewardPool,
  getSupplyLimit,
  getTotalValueLocked,
  getUserPortfolio,
  getVeSca,
  getVeScas,
  getVeScaTreasuryInfo,
  isIsolatedAsset,
  queryBorrowIncentiveAccounts,
  queryMarket,
  queryObligation,
  queryVeScaKeyIdFromReferralBindings,
} from 'src/queries';
import { SuiObjectRef, SuiObjectData } from '@mysten/sui/dist/cjs/client';
import { SuiObjectArg } from '@scallop-io/sui-kit';
import { ScallopQueryInterface } from './interface';

export type ScallopQueryParams = {
  indexer?: ScallopIndexer;
  utils?: ScallopUtils;
} & ScallopUtilsParams &
  ScallopIndexerParams;

class ScallopQuery implements ScallopQueryInterface {
  public readonly indexer: ScallopIndexer;
  public readonly utils: ScallopUtils;

  constructor(params: ScallopQueryParams) {
    this.utils = params.utils ?? new ScallopUtils(params);
    this.indexer =
      params.indexer ??
      new ScallopIndexer({
        queryClient: this.utils.queryClient,
        ...params,
      });
    this.initIndexerFallback();
  }

  initIndexerFallback() {
    // Wrap any method that has an indexer parameter as the last parameter
    this.queryMarket = withIndexerFallback.call(this, this.queryMarket);
    this.getMarketPools = withIndexerFallback.call(this, this.getMarketPools);
    this.getMarketPool = withIndexerFallback.call(this, this.getMarketPool);
    this.getMarketCollaterals = withIndexerFallback.call(
      this,
      this.getMarketCollaterals
    );
    this.getMarketCollateral = withIndexerFallback.call(
      this,
      this.getMarketCollateral
    );
    this.getSpools = withIndexerFallback.call(this, this.getSpools);
    this.getSpool = withIndexerFallback.call(this, this.getSpool);
    this.getBorrowIncentivePools = withIndexerFallback.call(
      this,
      this.getBorrowIncentivePools
    );
    this.getLendings = withIndexerFallback.call(this, this.getLendings);
    this.getLending = withIndexerFallback.call(this, this.getLending);
    this.getObligationAccounts = withIndexerFallback.call(
      this,
      this.getObligationAccounts
    );
    this.getObligationAccount = withIndexerFallback.call(
      this,
      this.getObligationAccount
    );
    this.getTvl = withIndexerFallback.call(this, this.getTvl);
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param force - Whether to force initialization.
   */
  async init(force: boolean = false) {
    await this.utils.init({ force });
  }

  get constants() {
    return this.utils.constants;
  }

  get walletAddress() {
    return this.utils.walletAddress;
  }

  get scallopSuiKit() {
    return this.utils.scallopSuiKit;
  }

  get address() {
    return this.utils.address;
  }

  /* ==================== Core Query Methods ==================== */

  /**
   * @deprecated use getMarketPools
   * Query market data.
   * @param indexer - Whether to use indexer.
   * @return Market data.
   */
  public async queryMarket(args?: {
    coinPrices?: CoinPrices;
    indexer?: boolean;
  }) {
    return await queryMarket(this, args?.indexer, args?.coinPrices);
  }

  /**
   * Get market pools.
   *
   * @description
   * To obtain all market pools at once, it is recommended to use
   * the `queryMarket` method to reduce time consumption.
   *
   * @param poolCoinNames - Specific an array of support pool coin name.
   * @param indexer - Whether to use indexer.
   * @return Market pools data.
   */
  public async getMarketPools(
    poolCoinNames: string[] = [...this.address.getWhitelist('lending')],
    args?: {
      coinPrices?: CoinPrices;
      indexer?: boolean;
    }
  ) {
    return await getMarketPools(
      this,
      poolCoinNames,
      args?.indexer,
      args?.coinPrices
    );
  }

  /**
   * Get  market pool
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param indexer - Whether to use indexer.
   * @return Market pool data.
   */
  public async getMarketPool(
    poolCoinName: string,
    args?: {
      coinPrice?: number;
      indexer?: boolean;
    }
  ) {
    const marketPools = await this.getMarketPools(undefined, args);
    return marketPools.pools[poolCoinName];
  }

  /**
   * Get market collaterals.
   *
   * @description
   * To obtain all market collaterals at once, it is recommended to use
   * the `queryMarket` method to reduce time consumption.
   *
   * @param collateralCoinNames - Specific an array of support collateral coin name.
   * @param indexer - Whether to use indexer.
   * @return Market collaterals data.
   */
  public async getMarketCollaterals(
    collateralCoinNames: string[] = [
      ...this.address.getWhitelist('collateral'),
    ],
    args?: { indexer?: boolean }
  ) {
    return await getMarketCollaterals(this, collateralCoinNames, args?.indexer);
  }

  /**
   * Get market collateral
   *
   * @param collateralCoinName - Specific support collateral coin name.
   * @param indexer - Whether to use indexer.
   * @return Market collateral data.
   */
  public async getMarketCollateral(
    collateralCoinName: string,
    args?: { indexer?: boolean }
  ) {
    return await getMarketCollateral(this, collateralCoinName, args?.indexer);
  }

  /**
   * Get obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data.
   */
  public async getObligations(ownerAddress: string = this.walletAddress) {
    return await getObligations(this, ownerAddress);
  }

  /**
   * Query obligation data.
   *
   * @param obligationId - The obligation id.
   * @return Obligation data.
   */
  public async queryObligation(obligationId: SuiObjectArg) {
    return queryObligation(this, obligationId);
  }

  /**
   * Get all asset coin amounts.
   *
   * @param assetCoinNames - Specific an array of support asset coin name.
   * @param ownerAddress - The owner address.
   * @return All coin amounts.
   */
  public async getCoinAmounts(
    assetCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    return await getCoinAmounts(this, assetCoinNames, ownerAddress);
  }

  /**
   * Get asset coin amount.
   *
   * @param assetCoinName - Specific support asset coin name.
   * @param ownerAddress - The owner address.
   * @return Coin amount.
   */
  public async getCoinAmount(
    assetCoinName: string,
    ownerAddress: string = this.walletAddress
  ) {
    return await getCoinAmount(this, assetCoinName, ownerAddress);
  }

  /**
   * Get all market coin amounts.
   *
   * @param coinNames - Specific an array of support market coin name.
   * @param ownerAddress - The owner address.
   * @return All market market coin amounts.
   */
  public async getMarketCoinAmounts(
    marketCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    return await getMarketCoinAmounts(this, marketCoinNames, ownerAddress);
  }

  /**
   * Get market coin amount.
   *
   * @param coinNames - Specific support market coin name.
   * @param ownerAddress - The owner address.
   * @return Market market coin amount.
   */
  public async getMarketCoinAmount(
    marketCoinName: string,
    ownerAddress: string = this.walletAddress
  ) {
    return await getMarketCoinAmount(this, marketCoinName, ownerAddress);
  }

  /**
   * Get price from pyth fee object.
   *
   * @param assetCoinName - Specific support asset coin name.
   * @return Asset coin price.
   */
  public async getPriceFromPyth(assetCoinName: string) {
    return await getPythPrice(this, assetCoinName);
  }

  /**
   * Get prices from pyth fee object.
   *
   * @param assetCoinNames - Array of supported asset coin names.
   * @return Array of asset coin prices.
   */
  public async getPricesFromPyth(assetCoinNames: string[]) {
    return await getPythPrices(this, assetCoinNames);
  }

  /* ==================== Spool Query Methods ==================== */

  /**
   * Get spools data.
   *
   * @param stakeMarketCoinNames - Specific an array of support stake market coin name.
   * @param indexer - Whether to use indexer.
   * @return Spools data.
   */
  public async getSpools(
    stakeMarketCoinNames?: string[],
    args?: {
      marketPools?: MarketPools;
      coinPrices?: CoinPrices;
      indexer?: boolean;
    }
  ) {
    return await getSpools(
      this,
      stakeMarketCoinNames,
      args?.indexer,
      args?.marketPools,
      args?.coinPrices
    );
  }

  /**
   * Get spool data.
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @param indexer - Whether to use indexer.
   * @return Spool data.
   */
  public async getSpool(
    stakeMarketCoinName: string,
    args?: {
      marketPool?: MarketPool;
      coinPrices?: CoinPrices;
      indexer?: boolean;
    }
  ) {
    const spools = await this.getSpools(undefined, args);
    return spools[stakeMarketCoinName];
  }

  /**
   * Get stake accounts data for all stake pools (spools).
   *
   * @param ownerAddress - The owner address.
   * @return All Stake accounts data.
   */
  public async getAllStakeAccounts(ownerAddress: string = this.walletAddress) {
    return await getStakeAccounts(this, ownerAddress);
  }

  /**
   * Get stake accounts data for specific stake pool (spool).
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @param ownerAddress - The owner address.
   * @return Stake accounts data.
   */
  public async getStakeAccounts(
    stakeMarketCoinName: string,
    ownerAddress: string = this.walletAddress
  ) {
    const allStakeAccount = await this.getAllStakeAccounts(ownerAddress);
    return allStakeAccount[stakeMarketCoinName] ?? [];
  }

  /**
   * Get stake pools (spools) data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpools` method
   * to get all spools data.
   *
   * @param stakeMarketCoinNames - Specific an array of support stake market coin name.
   * @return Stake pools data.
   */
  public async getStakePools(
    stakeMarketCoinNames: string[] = [...this.address.getWhitelist('spool')]
  ) {
    const stakePools: StakePools = {};
    for (const stakeMarketCoinName of stakeMarketCoinNames) {
      const stakePool = await getStakePool(this, stakeMarketCoinName);

      if (stakePool) {
        stakePools[stakeMarketCoinName] = stakePool;
      }
    }

    return stakePools;
  }

  /**
   * Get stake pool (spool) data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpool` method
   * to get all spool data.
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @return Stake pool data.
   */
  public async getStakePool(stakeMarketCoinName: string) {
    return await getStakePool(this, stakeMarketCoinName);
  }

  /**
   * Get stake reward pools data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpools` method
   * to get all spools data.
   *
   * @param stakeMarketCoinNames - Specific an array of stake market coin name.
   * @return Stake reward pools data.
   */
  public async getStakeRewardPools(
    stakeMarketCoinNames: string[] = [...this.address.getWhitelist('spool')]
  ) {
    const stakeRewardPools: StakeRewardPools = {};
    await Promise.allSettled(
      stakeMarketCoinNames.map(async (stakeMarketCoinName) => {
        const stakeRewardPool = await getStakeRewardPool(
          this,
          stakeMarketCoinName
        );

        if (stakeRewardPool) {
          stakeRewardPools[stakeMarketCoinName] = stakeRewardPool;
        }
      })
    );
    return stakeRewardPools;
  }

  /**
   * Get stake reward pool data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpool` method
   * to get spool data.
   *
   * @param marketCoinName - Specific support stake market coin name.
   * @return Stake reward pool data.
   */
  public async getStakeRewardPool(stakeMarketCoinName: string) {
    return await getStakeRewardPool(this, stakeMarketCoinName);
  }

  /**
   * Get borrow incentive pools data.
   *
   * @param coinNames - Specific an array of support borrow incentive coin name.
   * @param indexer - Whether to use indexer.
   * @return Borrow incentive pools data.
   */
  public async getBorrowIncentivePools(
    coinNames: string[] = [...this.address.getWhitelist('lending')],
    args?: {
      coinPrices?: CoinPrices;
      indexer?: boolean;
      marketPools?: MarketPools;
    }
  ) {
    return await getBorrowIncentivePools(
      this,
      coinNames,
      args?.indexer,
      args?.marketPools,
      args?.coinPrices
    );
  }

  /**
   * Get borrow incentive accounts data.
   *
   * @param coinNames - Specific support borrow incentive coin name.
   * @param ownerAddress - The owner address.
   * @return Borrow incentive accounts data.
   */
  public async getBorrowIncentiveAccounts(
    obligationId: string | SuiObjectRef,
    coinNames?: string[]
  ) {
    return await queryBorrowIncentiveAccounts(this, obligationId, coinNames);
  }

  /**
   * Get user lending and spool infomation for specific pools.
   *
   * @param poolCoinNames - Specific an array of support pool coin name.
   * @param ownerAddress - The owner address.
   * @param indexer - Whether to use indexer.
   * @return All lending and spool infomation.
   */
  public async getLendings(
    poolCoinNames?: string[],
    ownerAddress: string = this.walletAddress,
    args?: {
      indexer?: boolean;
      marketPools?: MarketPools;
      coinPrices?: CoinPrices;
    }
  ) {
    return await getLendings(
      this,
      poolCoinNames,
      ownerAddress,
      args?.marketPools,
      args?.coinPrices,
      args?.indexer
    );
  }

  /**
   * Get user lending and spool information for specific pool.
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param ownerAddress - The owner address.
   * @param indexer - Whether to use indexer.
   * @return Lending pool data.
   */
  public async getLending(
    poolCoinName: string,
    ownerAddress: string = this.walletAddress,
    args?: { indexer?: boolean }
  ) {
    return await getLending(this, poolCoinName, ownerAddress, args?.indexer);
  }

  /**
   * Get user all obligation accounts information.
   *
   * @description
   * All collateral and borrowing information in all obligation accounts owned by the user.
   *
   * @param ownerAddress - The owner address.
   * @param indexer - Whether to use indexer.
   * @return All obligation accounts information.
   */
  public async getObligationAccounts(
    ownerAddress: string = this.walletAddress,
    args?: {
      indexer?: boolean;
      market?: {
        collaterals: MarketCollaterals;
        pools: MarketPools;
      };
      coinPrices?: CoinPrices;
    }
  ) {
    return await getObligationAccounts(
      this,
      ownerAddress,
      args?.market,
      args?.coinPrices,
      args?.indexer
    );
  }

  /**
   * Get obligation account information for specific id.
   *
   * @description
   * borrowing and obligation information for specific pool.
   *
   * @param obligationId - The obligation id.
   * @param ownerAddress - The owner address.
   * @param indexer - Whether to use indexer.
   * @return Borrowing and collateral information.
   */
  public async getObligationAccount(
    obligationId: string,
    ownerAddress: string = this.walletAddress,
    args?: { indexer?: boolean }
  ) {
    const results = await this.getObligationAccounts(ownerAddress, args);
    return Object.values(results).find(
      (obligation) => obligation?.obligationId === obligationId
    );
  }

  /**
   * Get total value locked.
   *
   * @param indexer - Whether to use indexer.
   * @description
   * Include total supplied value and total borrowed value.
   *
   * @return Total value locked.
   */
  public async getTvl(args?: { indexer?: boolean }) {
    return await getTotalValueLocked(this, args?.indexer);
  }

  /**
   * Get veSca data.
   * @param veScaKey
   * @returns veSca
   */
  public async getVeSca(veScaKey: string | SuiObjectData) {
    return await getVeSca(this.utils, veScaKey);
  }

  /**
   * Get all veSca from walletAdddress
   * @param walletAddress
   * @returns array of veSca
   */
  public async getVeScas({
    walletAddress = this.walletAddress,
    excludeEmpty = false,
  }: {
    walletAddress?: string;
    excludeEmpty?: boolean;
  } = {}) {
    return await getVeScas(this, walletAddress, excludeEmpty);
  }

  /**
   * Get total vesca treasury with movecall
   * @returns Promise<string | undefined>
   */
  public async getVeScaTreasuryInfo() {
    return await getVeScaTreasuryInfo(this.utils);
  }

  /**
   * Return binded referrer veScaKeyId of referee walletAddress if exist
   * @param walletAddress
   * @returns veScaKeyId
   */
  public async getVeScaKeyIdFromReferralBindings(
    walletAddress: string = this.walletAddress
  ) {
    return await queryVeScaKeyIdFromReferralBindings(this, walletAddress);
  }

  /**
   * Get binded obligationId from a veScaKey if it exists.
   * @param veScaKey
   * @returns obligationId
   */
  public async getBindedObligationId(veScaKey: string) {
    return await getBindedObligationId(this, veScaKey);
  }

  /**
   * Get binded veSCA key from a obligationId if it exists.
   * @param obligationId
   * @returns veScaKey
   */
  public async getBindedVeScaKey(obligationId: string) {
    return await getBindedVeScaKey(this, obligationId);
  }

  /**
   * Get user's veSCA loyalty program informations
   * @param walletAddress
   * @returns Loyalty program information
   */
  public async getLoyaltyProgramInfos(veScaKey?: string | SuiObjectData) {
    return await getLoyaltyProgramInformations(this, veScaKey);
  }

  /**
   * Get total supply of sCoin
   * @param sCoinName - Supported sCoin name
   * @returns Total Supply
   */
  public async getSCoinTotalSupply(sCoinName: string) {
    return await getSCoinTotalSupply(this, sCoinName);
  }

  /**
   * Get all sCoin amounts.
   *
   * @param sCoinNames - Specific an array of support sCoin name.
   * @param ownerAddress - The owner address.
   * @return All market sCoin amounts.
   */
  public async getSCoinAmounts(
    sCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    return await getSCoinAmounts(this, sCoinNames, ownerAddress);
  }

  /**
   * Get sCoin amount.
   *
   * @param coinNames - Specific support sCoin name.
   * @param ownerAddress - The owner address.
   * @return sCoin amount.
   */
  public async getSCoinAmount(
    sCoinName: string | string,
    ownerAddress: string = this.walletAddress
  ) {
    const parsedSCoinName = this.utils.parseSCoinName(sCoinName);
    return parsedSCoinName
      ? await getSCoinAmount(this, parsedSCoinName, ownerAddress)
      : 0;
  }

  /**
   * Get swap rate from sCoin A to sCoin B
   * @param assetCoinNames
   * @returns
   */
  public async getSCoinSwapRate(fromSCoin: string, toSCoin: string) {
    return await getSCoinSwapRate(this, fromSCoin, toSCoin);
  }

  /*
   * Get flashloan fee for specified assets
   */
  public async getFlashLoanFees(
    assetCoinNames: string[] = [...this.address.getWhitelist('lending')]
  ) {
    return await getFlashLoanFees(this, assetCoinNames);
  }

  /**
   * Get supply limit of lending pool
   */
  public async getPoolSupplyLimit(poolName: string) {
    return await getSupplyLimit(this.utils, poolName);
  }

  /**
   * Get borrow limit of borrow pool
   */
  public async getPoolBorrowLimit(poolName: string) {
    return await getBorrowLimit(this.utils, poolName);
  }

  /**
   * Get list of isolated assets
   */
  public async getIsolatedAssets() {
    return await getIsolatedAssets(this);
  }

  /**
   * Check if asset is an isolated asset
   */
  public async isIsolatedAsset(assetCoinName: string) {
    return isIsolatedAsset(this.utils, assetCoinName);
  }

  /**
   * Get pool coin price from indexer
   * @param coinName
   * @returns price data
   */
  public async getCoinPriceByIndexer(poolName: string) {
    return this.indexer.getCoinPrice(poolName);
  }

  /**
   * Get all supported pool price from indexer
   * @returns prices data
   */
  public async getCoinPricesByIndexer() {
    return this.indexer.getCoinPrices();
  }

  /**
   * Get all coin prices, including sCoin
   * @returns prices data
   */
  public async getAllCoinPrices(args?: {
    marketPools?: MarketPools;
    coinPrices?: CoinPrices;
    indexer?: boolean;
  }) {
    return getAllCoinPrices(
      this,
      args?.marketPools,
      args?.coinPrices,
      args?.indexer
    );
  }

  /**
   * Query all address (lending pool, collateral pool, borrow dynamics, interest models, etc.) of all pool
   * @returns
   */
  public async getPoolAddresses(apiAddressId = this.address.getId()) {
    if (!apiAddressId) throw new Error('apiAddressId is required');
    return getPoolAddresses(apiAddressId);
  }

  /**
   * Get user portfolio
   */
  public async getUserPortfolio(args?: {
    walletAddress?: string;
    indexer?: boolean;
  }) {
    return getUserPortfolio(
      this,
      args?.walletAddress ?? this.walletAddress,
      args?.indexer ?? false
    );
  }

  /**
   * Get both primary and secondary price update policy objects
   * @returns price update policies
   */
  public async getPriceUpdatePolicies() {
    return await getPriceUpdatePolicies(this);
  }

  /**
   * Return the supported primary and secondary oracles for all supported pool assets
   * @returns
   */
  public async getAssetOracles() {
    const [primary, secondary] = await Promise.all([
      getAssetOracles(this.utils, 'primary'),
      getAssetOracles(this.utils, 'secondary'),
    ]);

    return [...this.address.getWhitelist('lending')].reduce(
      (acc, pool) => {
        acc[pool] = {
          primary: (primary?.[pool] ?? []) as SupportOracleType[],
          secondary: (secondary?.[pool] ?? []) as SupportOracleType[],
        };
        return acc;
      },
      {} as Record<string, xOracleRules>
    );
  }

  /**
   * Get switchboard on-demand aggregator object id based on coinType
   * @param coinType
   * @returns
   */
  public async getSwitchboardOnDemandAggregatorObjectIds(coinName: string[]) {
    return await getOnDemandAggObjectIds(this, coinName);
  }
}

export default ScallopQuery;
