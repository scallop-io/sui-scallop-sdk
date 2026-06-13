import ScallopUtils, { ScallopUtilsParams } from './scallopUtils.js';
import ScallopIndexer, { ScallopIndexerParams } from './scallopIndexer.js';
import type { QueryOptions } from 'src/utils/index.js';
import { resolveQuerySource, runWithSourceFallback } from 'src/utils/index.js';
import { calculateTotalValueLocked } from 'src/services/index.js';
import { ObligationService } from 'src/services/query/ObligationService.js';
import { LendingReadService } from 'src/services/query/LendingReadService.js';
import { PriceService } from 'src/services/query/PriceService.js';
import {
  createRepositories,
  type Repositories,
} from 'src/repositories_v2/wiring/registry.js';
import {
  fromQueryOptions,
  toQuerySource,
} from 'src/repositories_v2/wiring/source.js';
import { ScallopParseError } from 'src/errors/index.js';
import {
  CoinPrices,
  MarketCollaterals,
  MarketPool,
  MarketPools,
  StakePools,
  SuiObjectData,
  SuiObjectRef,
  TotalValueLocked,
} from 'src/types/index.js';
import {
  getBindedObligation,
  getBindedVeScaKey,
  getBorrowLimit,
  getOnDemandAggObjectIds,
  getPoolAddresses,
  getPriceUpdatePolicies,
  getSCoinSwapRate,
  getStakePool,
  getSupplyLimit,
  getUserPortfolio,
  isIsolatedAsset,
  queryVeScaKeyIdFromReferralBindings,
} from 'src/queries/index.js';
import { SuiObjectArg } from '@scallop-io/sui-kit';
import { ScallopQueryInterface } from './interface.js';

export type ScallopQueryParams = {
  indexer?: ScallopIndexer;
  utils?: ScallopUtils;
} & ScallopUtilsParams &
  ScallopIndexerParams;

/** Project a record down to the requested keys, dropping missing entries. */
const pickRecord = <T>(
  record: Record<string, T | undefined>,
  names: string[]
): Record<string, T> =>
  names.reduce(
    (acc, name) => {
      const value = record[name];
      if (value !== undefined) acc[name] = value;
      return acc;
    },
    {} as Record<string, T>
  );

class ScallopQuery implements ScallopQueryInterface {
  public readonly indexer: ScallopIndexer;
  public readonly utils: ScallopUtils;
  public readonly obligationService: ObligationService;
  public readonly lendingReadService: LendingReadService;
  public readonly priceService: PriceService;

  constructor(params: ScallopQueryParams = {}) {
    this.utils = params.utils ?? new ScallopUtils(params);
    this.indexer =
      params.indexer ??
      new ScallopIndexer({
        queryClient: this.utils.queryClient,
        ...params,
      });
    this.obligationService = new ObligationService({
      query: this,
      logger: this.utils.logger,
    });
    this.lendingReadService = new LendingReadService({
      query: this,
      logger: this.utils.logger,
    });
    this.priceService = new PriceService({
      query: this,
      indexer: this.indexer,
      utils: this.utils,
      logger: this.utils.logger,
    });
  }

  get logger() {
    return this.utils.logger;
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

  /**
   * The repositories_v2 registry — the clean read layer the facade is migrating
   * onto. Built lazily from `this.utils` on first access (after `init()`), then
   * memoised. Single-domain read methods delegate here; cross-domain assembly
   * stays in the query services until Phase 3 (see PLAN.md).
   */
  private _repos?: Repositories;
  get repos(): Repositories {
    return (this._repos ??= createRepositories({ utils: this.utils }));
  }

  /* ==================== Core Query Methods ==================== */

  /**
   * Shared market read: auto-fetch coin prices when the caller doesn't supply
   * them (otherwise every pool/collateral price would be 0), then delegate to
   * the market repository. Used by getMarketPools / getMarketCollaterals.
   */
  private async fetchMarkets(
    args?: QueryOptions & { coinPrices?: CoinPrices }
  ) {
    const coinPrices =
      args?.coinPrices ?? (await this.utils.getCoinPrices()) ?? {};
    return this.repos.market.getMarkets({
      coinPrices,
      source: fromQueryOptions(args),
    });
  }

  /**
   * Get market pools.
   *
   * @description
   * Fetches the full market once (pools + collaterals) and projects the result;
   * reuse the returned data rather than calling per-coin to reduce RPC load.
   *
   * @param poolCoinNames - Specific an array of support pool coin name.
   * @param indexer - Whether to use indexer.
   * @return Market pools data.
   */
  async getMarketPools(
    poolCoinNames: string[] = [...this.constants.whitelist.lending],
    args?: {
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    const { pools, collaterals } = await this.fetchMarkets(args);
    return {
      pools: pickRecord(pools, poolCoinNames),
      collaterals: pickRecord(collaterals, poolCoinNames),
    };
  }

  /**
   * Get  market pool
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param indexer - Whether to use indexer.
   * @return Market pool data.
   */
  async getMarketPool(
    poolCoinName: string,
    args?: {
      coinPrice?: number;
    } & QueryOptions
  ) {
    const marketPools = await this.getMarketPools(undefined, args);
    return marketPools.pools[poolCoinName];
  }

  /**
   * Get market collaterals.
   *
   * @description
   * Fetches the full market once (pools + collaterals) and projects the result;
   * reuse the returned data rather than calling per-coin to reduce RPC load.
   *
   * @param collateralCoinNames - Specific an array of support collateral coin name.
   * @param indexer - Whether to use indexer.
   * @return Market collaterals data.
   */
  async getMarketCollaterals(
    collateralCoinNames: string[] = [...this.constants.whitelist.collateral],
    args?: QueryOptions
  ) {
    const { collaterals } = await this.fetchMarkets(args);
    return pickRecord(collaterals, collateralCoinNames);
  }

  /**
   * Get market collateral
   *
   * @param collateralCoinName - Specific support collateral coin name.
   * @param indexer - Whether to use indexer.
   * @return Market collateral data.
   */
  async getMarketCollateral(collateralCoinName: string, args?: QueryOptions) {
    return (await this.getMarketCollaterals(undefined, args))[
      collateralCoinName
    ];
  }

  /**
   * Get obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data.
   */
  async getObligations(ownerAddress: string = this.walletAddress) {
    return this.repos.obligation.getObligations(ownerAddress);
  }

  /**
   * Query obligation data.
   *
   * @param obligationId - The obligation id.
   * @return Obligation data.
   */
  async queryObligation(obligationId: SuiObjectArg) {
    const id =
      typeof obligationId === 'string'
        ? obligationId
        : 'objectId' in obligationId
          ? obligationId.objectId
          : undefined;
    if (id === undefined) {
      throw new ScallopParseError(
        'queryObligation expects an object id (string) or an object reference'
      );
    }
    return this.repos.obligation.getObligationData(id);
  }

  /**
   * Get all asset coin amounts.
   *
   * @param assetCoinNames - Specific an array of support asset coin name.
   * @param ownerAddress - The owner address.
   * @return All coin amounts.
   */
  async getCoinAmounts(
    assetCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    return await this.repos.coinBalance.getCoinAmounts({
      coinNames: assetCoinNames,
      address: ownerAddress,
    });
  }

  /**
   * Get asset coin amount.
   *
   * @param assetCoinName - Specific support asset coin name.
   * @param ownerAddress - The owner address.
   * @return Coin amount.
   */
  async getCoinAmount(
    assetCoinName: string,
    ownerAddress: string = this.walletAddress
  ) {
    return await this.repos.coinBalance.getCoinAmount({
      coinName: assetCoinName,
      address: ownerAddress,
    });
  }

  /**
   * Get all market coin amounts.
   *
   * @param coinNames - Specific an array of support market coin name.
   * @param ownerAddress - The owner address.
   * @return All market market coin amounts.
   */
  async getMarketCoinAmounts(
    marketCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    // Preserve the legacy default set: lending whitelist mapped to market-coin
    // names (the repo's own default is the sCoin whitelist, a different set).
    const names =
      marketCoinNames ??
      [...this.constants.whitelist.lending].map((coinName) =>
        this.utils.parseMarketCoinName(coinName)
      );
    return await this.repos.coinBalance.getMarketCoinAmounts({
      marketCoinNames: names,
      address: ownerAddress,
    });
  }

  /**
   * Get market coin amount.
   *
   * @param coinNames - Specific support market coin name.
   * @param ownerAddress - The owner address.
   * @return Market market coin amount.
   */
  async getMarketCoinAmount(
    marketCoinName: string,
    ownerAddress: string = this.walletAddress
  ) {
    return await this.repos.coinBalance.getMarketCoinAmount({
      marketCoinName,
      address: ownerAddress,
    });
  }

  /**
   * Get price from pyth fee object.
   *
   * @param assetCoinName - Specific support asset coin name.
   * @return Asset coin price.
   */
  async getPriceFromPyth(assetCoinName: string) {
    return this.priceService.getPriceFromPyth(assetCoinName);
  }

  /**
   * Get prices from pyth fee object.
   *
   * @param assetCoinNames - Array of supported asset coin names.
   * @return Array of asset coin prices.
   */
  async getPricesFromPyth(assetCoinNames: string[]) {
    return this.priceService.getPricesFromPyth(assetCoinNames);
  }

  /* ==================== Spool Query Methods ==================== */

  /**
   * Get spools data.
   *
   * @param stakeMarketCoinNames - Specific an array of support stake market coin name.
   * @param indexer - Whether to use indexer.
   * @return Spools data.
   */
  async getSpools(
    stakeMarketCoinNames?: string[],
    args?: {
      marketPools?: MarketPools;
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    const coinPrices =
      args?.coinPrices ??
      (await this.getAllCoinPrices({ marketPools: args?.marketPools })) ??
      {};
    return this.repos.spool.getSpools({
      stakeCoinNames: stakeMarketCoinNames ?? [
        ...this.constants.whitelist.spool,
      ],
      coinPrices,
      source: fromQueryOptions(args),
    });
  }

  /**
   * Get spool data.
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @param indexer - Whether to use indexer.
   * @return Spool data.
   */
  async getSpool(
    stakeMarketCoinName: string,
    args?: {
      marketPool?: MarketPool;
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    const coinPrices =
      args?.coinPrices ?? (await this.getAllCoinPrices()) ?? {};
    return this.repos.spool.getSpool({
      stakeCoinName: stakeMarketCoinName,
      coinPrices,
      source: fromQueryOptions(args),
    });
  }

  /**
   * Get stake accounts data for all stake pools (spools).
   *
   * @param ownerAddress - The owner address.
   * @return All Stake accounts data.
   */
  async getAllStakeAccounts(ownerAddress: string = this.walletAddress) {
    return await this.repos.spool.getStakeAccounts({ address: ownerAddress });
  }

  /**
   * Get stake accounts data for specific stake pool (spool).
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @param ownerAddress - The owner address.
   * @return Stake accounts data.
   */
  async getStakeAccounts(
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
  async getStakePools(
    stakeMarketCoinNames: string[] = [...this.constants.whitelist.spool]
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
  async getStakePool(stakeMarketCoinName: string) {
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
  async getStakeRewardPools(
    stakeMarketCoinNames: string[] = [...this.constants.whitelist.spool]
  ) {
    return this.repos.spool.getSpoolRewardPools(stakeMarketCoinNames);
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
  async getStakeRewardPool(stakeMarketCoinName: string) {
    return this.repos.spool.getSpoolRewardPool(stakeMarketCoinName);
  }

  /**
   * Get borrow incentive pools data.
   *
   * @param coinNames - Specific an array of support borrow incentive coin name.
   * @param indexer - Whether to use indexer.
   * @return Borrow incentive pools data.
   */
  async getBorrowIncentivePools(
    coinNames: string[] = [...this.constants.whitelist.lending],
    args?: {
      coinPrices?: CoinPrices;
      marketPools?: MarketPools;
    } & QueryOptions
  ) {
    const coinPrices =
      args?.coinPrices ??
      (await this.getAllCoinPrices({ marketPools: args?.marketPools })) ??
      {};
    return this.repos.borrowIncentive.getBorrowIncentivePools({
      coinNames,
      coinPrices,
    });
  }

  /**
   * Get borrow incentive accounts data.
   *
   * @param coinNames - Specific support borrow incentive coin name.
   * @param ownerAddress - The owner address.
   * @return Borrow incentive accounts data.
   */
  async getBorrowIncentiveAccounts(
    obligationId: string | SuiObjectRef,
    coinNames: string[] = [...this.constants.whitelist.lending]
  ) {
    return await this.repos.borrowIncentive.getBorrowIncentiveAccounts({
      obligationId:
        typeof obligationId === 'string' ? obligationId : obligationId.objectId,
      coinNames,
    });
  }

  /**
   * Get user lending and spool infomation for specific pools.
   *
   * @param poolCoinNames - Specific an array of support pool coin name.
   * @param ownerAddress - The owner address.
   * @param indexer - Whether to use indexer.
   * @return All lending and spool infomation.
   */
  async getLendings(
    poolCoinNames?: string[],
    ownerAddress: string = this.walletAddress,
    args?: {
      marketPools?: MarketPools;
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    return this.lendingReadService.getLendings(
      poolCoinNames,
      ownerAddress,
      args
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
  async getLending(
    poolCoinName: string,
    ownerAddress: string = this.walletAddress,
    args?: QueryOptions
  ) {
    return this.lendingReadService.getLending(poolCoinName, ownerAddress, args);
  }

  /**
   * Get user all obligation accounts information from ownerAddress.
   *
   * @description
   * All collateral and borrowing information in all obligation accounts owned by the user.
   *
   * @param ownerAddress - The owner address.
   * @param args - Additional arguments.
   * @return All obligation accounts information.
   */
  async getObligationAccounts(
    ownerAddress: string = this.walletAddress,
    args?: {
      market?: {
        collaterals: MarketCollaterals;
        pools: MarketPools;
      };
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    return this.obligationService.getObligationAccounts(ownerAddress, args);
  }

  /**
   * Get user all obligation accounts information from obligationIds.
   *
   * @description
   * All collateral and borrowing information in all obligation accounts.
   *
   * @param obligationIds - Obligation IDs.
   * @param args - Additional arguments.
   * @return All obligation accounts information.
   */
  async getObligationAccountsByIds(
    obligationIds: string[],
    args?: {
      market?: {
        collaterals: MarketCollaterals;
        pools: MarketPools;
      };
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    return this.obligationService.getObligationAccountsByIds(
      obligationIds,
      args
    );
  }

  /**
   * Get obligation account by id
   *
   * @description
   * All collateral and borrowing information in obligation account.
   *
   * @param obligationId - Obligation ID.
   * @param args - Additional arguments.
   * @return All obligation accounts information.
   */
  async getObligationAccountById(
    obligationId: string,
    args?: {
      market?: {
        collaterals: MarketCollaterals;
        pools: MarketPools;
      };
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    return this.obligationService.getObligationAccountById(obligationId, args);
  }

  /**
   * Get obligation account information for specific id.
   *
   * @description
   * borrowing and obligation information for specific pool.
   *
   * @param obligationId - The obligation id.
   * @param ownerAddress - The owner address.
   * @param args - Additional arguments.
   * @return Borrowing and collateral information.
   */
  async getObligationAccount(
    obligationId: string,
    ownerAddress: string = this.walletAddress,
    args?: QueryOptions
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
  async getTvl(args?: QueryOptions) {
    const source = resolveQuerySource(args);
    return runWithSourceFallback<TotalValueLocked>({
      source,
      label: 'getTvl',
      logger: this.logger,
      indexer: async () => {
        const t = await this.indexer.getTotalValueLocked();
        return {
          supplyValue: t.supplyValue,
          supplyValueChangeRatio: t.supplyValueChangeRatio,
          borrowValue: t.borrowValue,
          borrowValueChangeRatio: t.borrowValueChangeRatio,
          totalValue: t.totalValue,
          totalValueChangeRatio: t.totalValueChangeRatio,
          supplyLendingValue: t.supplyLendingValue,
          supplyLendingValueChangeRatio: t.supplyLendingValueChangeRatio,
          supplyCollateralValue: t.supplyCollateralValue,
          supplyCollateralValueChangeRatio: t.supplyCollateralValueChangeRatio,
        };
      },
      rpc: async () =>
        calculateTotalValueLocked(
          await this.getMarketPools(undefined, { indexer: false })
        ),
    });
  }

  /**
   * Get veSca data.
   * @param veScaKey
   * @returns veSca
   */
  async getVeSca(veScaKey: string | SuiObjectData) {
    return await this.repos.veSca.getVeSca(
      typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId
    );
  }

  /**
   * Get all veSca from walletAdddress
   * @param walletAddress
   * @returns array of veSca
   */
  async getVeScas({
    walletAddress = this.walletAddress,
    excludeEmpty = false,
  }: {
    walletAddress?: string;
    excludeEmpty?: boolean;
  } = {}) {
    return await this.repos.veSca.getVeScasByAddress({
      address: walletAddress,
      excludeEmpty,
    });
  }

  /**
   * Get total vesca treasury with movecall
   * @returns Promise<string | undefined>
   */
  async getVeScaTreasuryInfo() {
    return await this.repos.veSca.getVeScaTreasuryInfo();
  }

  /**
   * Return binded referrer veScaKeyId of referee walletAddress if exist
   * @param walletAddress
   * @returns veScaKeyId
   */
  async getVeScaKeyIdFromReferralBindings(
    walletAddress: string = this.walletAddress
  ) {
    return await queryVeScaKeyIdFromReferralBindings(this, walletAddress);
  }

  /**
   * Get binded obligation from a veScaKey if it exists.
   * @param veScaKey
   * @returns { obligationId, obligationKey } if binded, otherwise null
   */
  async getBindedObligation(veScaKey: string) {
    return await getBindedObligation(this, veScaKey);
  }

  /**
   * Get binded veSCA key from a obligationId if it exists.
   * @param obligationId
   * @returns veScaKey
   */
  async getBindedVeScaKey(obligationId: string) {
    return await getBindedVeScaKey(this, obligationId);
  }

  /**
   * Get user's veSCA loyalty program informations
   * @param veScaKey
   * @returns Loyalty program information
   */
  async getLoyaltyProgramInfos(veScaKey?: string | SuiObjectData) {
    // Cross-domain default: fall back to the wallet's primary veSca key.
    const key = veScaKey ?? (await this.getVeScas())[0]?.keyId;
    const keyId = typeof key === 'string' ? key : key?.objectId;
    return this.repos.loyaltyProgram.getLoyaltyProgramInfos(keyId);
  }

  /**
   * Get user's veSCA rewards informations from loyalty program
   * @param veScaKey
   * @returns Loyalty program information
   */
  async getVeScaLoyaltyProgramInfos(veScaKey?: string | SuiObjectData) {
    const key = veScaKey ?? (await this.getVeScas())[0]?.keyId;
    const keyId = typeof key === 'string' ? key : key?.objectId;
    return this.repos.veScaLoyaltyProgram.getVeScaLoyaltyProgramInfos(keyId);
  }

  /**
   * Get total supply of sCoin
   * @param sCoinName - Supported sCoin name
   * @returns Total Supply
   */
  async getSCoinTotalSupply(sCoinName: string) {
    return await this.repos.coinBalance.getSCoinTotalSupply(sCoinName);
  }

  /**
   * Get all sCoin amounts.
   *
   * @param sCoinNames - Specific an array of support sCoin name.
   * @param ownerAddress - The owner address.
   * @return All market sCoin amounts.
   */
  async getSCoinAmounts(
    sCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    return await this.repos.coinBalance.getSCoinAmounts({
      sCoinNames,
      address: ownerAddress,
    });
  }

  /**
   * Get sCoin amount.
   *
   * @param coinNames - Specific support sCoin name.
   * @param ownerAddress - The owner address.
   * @return sCoin amount.
   */
  async getSCoinAmount(
    sCoinName: string | string,
    ownerAddress: string = this.walletAddress
  ) {
    const parsedSCoinName = this.utils.parseSCoinName(sCoinName);
    return parsedSCoinName
      ? await this.repos.coinBalance.getSCoinAmount({
          sCoinName: parsedSCoinName,
          address: ownerAddress,
        })
      : 0;
  }

  /**
   * Get swap rate from sCoin A to sCoin B
   * @param assetCoinNames
   * @returns
   */
  async getSCoinSwapRate(fromSCoin: string, toSCoin: string) {
    return await getSCoinSwapRate(this, fromSCoin, toSCoin);
  }

  /*
   * Get flashloan fee for specified assets
   */
  async getFlashLoanFees(
    assetCoinNames: string[] = [...this.constants.whitelist.lending]
  ) {
    return await this.repos.flashloan.getFlashloanFees(assetCoinNames);
  }

  /**
   * Get supply limit of lending pool
   */
  async getPoolSupplyLimit(poolName: string) {
    return await getSupplyLimit(this.utils, poolName);
  }

  /**
   * Get borrow limit of borrow pool
   */
  async getPoolBorrowLimit(poolName: string) {
    return await getBorrowLimit(this.utils, poolName);
  }

  /**
   * Get list of isolated assets
   */
  async getIsolatedAssets(useOnChainQuery: boolean = false) {
    return await this.repos.isolatedAssets.getIsolatedAssets({
      source: toQuerySource({ useOnChainQuery }),
    });
  }

  /**
   * Check if asset is an isolated asset
   */
  async isIsolatedAsset(
    assetCoinName: string,
    useOnChainQuery: boolean = false
  ) {
    return isIsolatedAsset(this.utils, assetCoinName, useOnChainQuery);
  }

  /**
   * Get pool coin price from indexer
   * @param coinName
   * @returns price data
   */
  async getCoinPriceByIndexer(poolName: string) {
    return this.priceService.getCoinPriceByIndexer(poolName);
  }

  /**
   * Get all supported pool price from indexer
   * @returns prices data
   */
  async getCoinPricesByIndexer() {
    return this.priceService.getCoinPricesByIndexer();
  }

  /**
   * Get all coin prices, including sCoin
   * @returns prices data
   */
  async getAllCoinPrices(args?: {
    marketPools?: MarketPools;
    coinPrices?: CoinPrices;
    indexer?: boolean;
  }) {
    return this.priceService.getAllCoinPrices(args);
  }

  /**
   * Query all address (lending pool, collateral pool, borrow dynamics, interest models, etc.) of all pool
   * @returns
   */
  async getPoolAddresses(apiAddressId = this.address.getId()) {
    if (!apiAddressId) throw new Error('apiAddressId is required');
    return getPoolAddresses(
      this.utils.scallopSuiKit.suiKit.client,
      apiAddressId
    );
  }

  /**
   * Get user portfolio
   */
  async getUserPortfolio(args?: { walletAddress?: string; indexer?: boolean }) {
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
  async getPriceUpdatePolicies() {
    return await getPriceUpdatePolicies(this);
  }

  /**
   * Return the supported primary and secondary oracles for all supported pool assets
   * @returns
   */
  async getAssetOracles() {
    return this.repos.xOracle.getAssetOracles();
  }

  /**
   * Get switchboard on-demand aggregator object id based on coinType
   * @param coinType
   * @returns
   */
  async getSwitchboardOnDemandAggregatorObjectIds(coinName: string[]) {
    return await getOnDemandAggObjectIds(this, coinName);
  }
}

export default ScallopQuery;
