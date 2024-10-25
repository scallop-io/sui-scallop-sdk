import { SuiKit } from '@scallop-io/sui-kit';
import { ADDRESSES_ID, SUPPORT_POOLS, SUPPORT_SPOOLS } from '../constants';
import {
  queryMarket,
  getObligations,
  queryObligation,
  getStakeAccounts,
  getStakePool,
  getStakeRewardPool,
  getPythPrice,
  getMarketPools,
  getMarketPool,
  getMarketCollaterals,
  getMarketCollateral,
  getSpools,
  getSpool,
  queryBorrowIncentiveAccounts,
  getCoinAmounts,
  getCoinAmount,
  getMarketCoinAmounts,
  getMarketCoinAmount,
  getLendings,
  getLending,
  getObligationAccounts,
  getObligationAccount,
  getTotalValueLocked,
  queryVeScaKeyIdFromReferralBindings,
  getBindedObligationId,
  getBindedVeScaKey,
  getVeScas,
  getPythPrices,
  getVeScaTreasuryInfo,
  getLoyaltyProgramInformations,
  getFlashLoanFees,
  getVeSca,
  getBorrowIncentivePools,
} from '../queries';
import {
  ScallopQueryParams,
  SupportStakeMarketCoins,
  SupportAssetCoins,
  SupportPoolCoins,
  SupportCollateralCoins,
  SupportMarketCoins,
  StakePools,
  StakeRewardPools,
  SupportBorrowIncentiveCoins,
  SupportSCoin,
  ScallopQueryInstanceParams,
} from '../types';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { ScallopIndexer } from './scallopIndexer';
import { ScallopCache } from './scallopCache';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache';
import { SuiObjectData } from '@mysten/sui/src/client';
import {
  getSCoinAmount,
  getSCoinAmounts,
  getSCoinSwapRate,
  getSCoinTotalSupply,
} from 'src/queries/sCoinQuery';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { getSupplyLimit } from 'src/queries/supplyLimit';
import { withIndexerFallback } from 'src/utils/indexer';

/**
 * @description
 * It provides methods for getting on-chain data from the Scallop contract.
 *
 * @example
 * ```typescript
 * const scallopQuery  = new ScallopQuery(<parameters>);
 * await scallopQuery.init();
 * scallopQuery.<query functions>();
 * await scallopQuery.<query functions>();
 * ```
 */
export class ScallopQuery {
  public readonly params: ScallopQueryParams;

  public suiKit: SuiKit;
  public address: ScallopAddress;
  public utils: ScallopUtils;
  public indexer: ScallopIndexer;
  public cache: ScallopCache;
  public walletAddress: string;

  public constructor(
    params: ScallopQueryParams,
    instance?: ScallopQueryInstanceParams
  ) {
    this.params = params;
    this.suiKit =
      instance?.suiKit ?? instance?.utils?.suiKit ?? new SuiKit(params);

    this.walletAddress = normalizeSuiAddress(
      params.walletAddress || this.suiKit.currentAddress()
    );

    if (instance?.utils) {
      this.utils = instance.utils;
      this.address = instance.utils.address;
      this.cache = this.address.cache;
    } else {
      this.cache = new ScallopCache(
        this.suiKit,
        this.walletAddress,
        DEFAULT_CACHE_OPTIONS
      );
      this.address = new ScallopAddress(
        {
          id: params?.addressesId || ADDRESSES_ID,
          network: params?.networkType,
          forceInterface: params?.forceAddressesInterface,
        },
        {
          cache: this.cache,
        }
      );
      this.utils = new ScallopUtils(this.params, {
        address: this.address,
      });
    }
    this.indexer =
      instance?.indexer ??
      new ScallopIndexer(this.params, { cache: this.cache });

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

  /* ========================================================== */

  /**
   * Request the scallop API to initialize data.
   *
   * @param force - Whether to force initialization.
   * @param address - ScallopAddress instance.
   */
  public async init(force: boolean = false, address?: ScallopAddress) {
    if (force || !this.address.getAddresses() || !address?.getAddresses()) {
      await this.address.read();
    } else {
      this.address = address;
    }

    await this.utils.init(force, this.address);
  }

  /* ==================== Core Query Methods ==================== */

  /**
   * Query market data.
   * @param indexer - Whether to use indexer.
   * @return Market data.
   */
  public async queryMarket(indexer: boolean = false) {
    return await queryMarket(this, indexer);
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
    poolCoinNames?: SupportPoolCoins[],
    indexer: boolean = false
  ) {
    return await getMarketPools(this, poolCoinNames, indexer);
  }

  /**
   * Get  market pool
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param indexer - Whether to use indexer.
   * @return Market pool data.
   */
  public async getMarketPool(
    poolCoinName: SupportPoolCoins,
    indexer: boolean = false
  ) {
    return await getMarketPool(this, poolCoinName, indexer);
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
    collateralCoinNames?: SupportCollateralCoins[],
    indexer: boolean = false
  ) {
    return await getMarketCollaterals(this, collateralCoinNames, indexer);
  }

  /**
   * Get market collateral
   *
   * @param collateralCoinName - Specific support collateral coin name.
   * @param indexer - Whether to use indexer.
   * @return Market collateral data.
   */
  public async getMarketCollateral(
    collateralCoinName: SupportCollateralCoins,
    indexer: boolean = false
  ) {
    return await getMarketCollateral(this, collateralCoinName, indexer);
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
  public async queryObligation(obligationId: string) {
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
    assetCoinNames?: SupportAssetCoins[],
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
    assetCoinName: SupportAssetCoins,
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
    marketCoinNames?: SupportMarketCoins[],
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
    marketCoinName: SupportMarketCoins,
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
  public async getPriceFromPyth(assetCoinName: SupportAssetCoins) {
    return await getPythPrice(this, assetCoinName);
  }

  /**
   * Get prices from pyth fee object.
   *
   * @param assetCoinNames - Array of supported asset coin names.
   * @return Array of asset coin prices.
   */
  public async getPricesFromPyth(assetCoinNames: SupportAssetCoins[]) {
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
    stakeMarketCoinNames?: SupportStakeMarketCoins[],
    indexer: boolean = false
  ) {
    return await getSpools(this, stakeMarketCoinNames, indexer);
  }

  /**
   * Get spool data.
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @param indexer - Whether to use indexer.
   * @return Spool data.
   */
  public async getSpool(
    stakeMarketCoinName: SupportStakeMarketCoins,
    indexer: boolean = false
  ) {
    return await getSpool(this, stakeMarketCoinName, indexer);
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
    stakeMarketCoinName: SupportStakeMarketCoins,
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
    stakeMarketCoinNames: SupportStakeMarketCoins[] = [...SUPPORT_SPOOLS]
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
  public async getStakePool(stakeMarketCoinName: SupportStakeMarketCoins) {
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
    stakeMarketCoinNames: SupportStakeMarketCoins[] = [...SUPPORT_SPOOLS]
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
  public async getStakeRewardPool(
    stakeMarketCoinName: SupportStakeMarketCoins
  ) {
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
    coinNames?: SupportBorrowIncentiveCoins[],
    indexer: boolean = false
  ) {
    return await getBorrowIncentivePools(this, coinNames, indexer);
  }

  /**
   * Get borrow incentive accounts data.
   *
   * @param coinNames - Specific support borrow incentive coin name.
   * @param ownerAddress - The owner address.
   * @return Borrow incentive accounts data.
   */
  public async getBorrowIncentiveAccounts(
    obligationId: string,
    coinNames?: SupportBorrowIncentiveCoins[]
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
    poolCoinNames?: SupportPoolCoins[],
    ownerAddress: string = this.walletAddress,
    indexer: boolean = false
  ) {
    return await getLendings(this, poolCoinNames, ownerAddress, indexer);
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
    poolCoinName: SupportPoolCoins,
    ownerAddress: string = this.walletAddress,
    indexer: boolean = false
  ) {
    return await getLending(this, poolCoinName, ownerAddress, indexer);
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
    indexer: boolean = false
  ) {
    return await getObligationAccounts(this, ownerAddress, indexer);
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
    indexer: boolean = false
  ) {
    return await getObligationAccount(
      this,
      obligationId,
      ownerAddress,
      indexer
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
  public async getTvl(indexer: boolean = false) {
    return await getTotalValueLocked(this, indexer);
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
    return await queryVeScaKeyIdFromReferralBindings(
      this.address,
      walletAddress
    );
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
  public async getSCoinTotalSupply(sCoinName: SupportSCoin) {
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
    sCoinNames?: SupportSCoin[],
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
    sCoinName: SupportSCoin | SupportMarketCoins,
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
  public async getSCoinSwapRate(
    fromSCoin: SupportSCoin,
    toSCoin: SupportSCoin
  ) {
    return await getSCoinSwapRate(this, fromSCoin, toSCoin);
  }

  /*
   * Get flashloan fee for specified assets
   */
  public async getFlashLoanFees(
    assetCoinNames: SupportAssetCoins[] = [...SUPPORT_POOLS]
  ) {
    return await getFlashLoanFees(this, assetCoinNames);
  }

  /**
   * Get supply limit of supply pool
   */
  public async getPoolSupplyLimit(poolName: SupportPoolCoins) {
    return await getSupplyLimit(this.utils, poolName);
  }
}
