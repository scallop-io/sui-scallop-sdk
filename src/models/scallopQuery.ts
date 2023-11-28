import { SuiKit } from '@scallop-io/sui-kit';
import { ADDRESSES_ID, SUPPORT_SPOOLS } from '../constants';
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
  queryBorrowIncentivePools,
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
} from '../queries';
import {
  ScallopQueryParams,
  ScallopInstanceParams,
  SupportStakeMarketCoins,
  SupportAssetCoins,
  SupportPoolCoins,
  SupportCollateralCoins,
  SupportMarketCoins,
  StakePools,
  StakeRewardPools,
  SupportBorrowIncentiveCoins,
} from '../types';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';

/**
 * @description
 * it provides methods for getting on-chain data from the Scallop contract.
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

  public constructor(
    params: ScallopQueryParams,
    instance?: ScallopInstanceParams
  ) {
    this.params = params;
    this.suiKit = instance?.suiKit ?? new SuiKit(params);
    this.address =
      instance?.address ??
      new ScallopAddress({
        id: params?.addressesId || ADDRESSES_ID,
        network: params?.networkType,
      });
    this.utils =
      instance?.utils ??
      new ScallopUtils(this.params, {
        suiKit: this.suiKit,
        address: this.address,
        query: this,
      });
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param forece - Whether to force initialization.
   */
  public async init(forece: boolean = false) {
    if (forece || !this.address.getAddresses()) {
      await this.address.read();
    }
    await this.utils.init(forece);
  }

  /* ==================== Core Query Methods ==================== */

  /**
   * Query market data.
   *
   * @return Market data.
   */
  public async queryMarket() {
    return await queryMarket(this);
  }

  /**
   * Get market pools.
   *
   * @description
   * To obtain all market pools at once, it is recommended to use
   * the `queryMarket` method to reduce time consumption.
   *
   * @param poolCoinNames - Specific an array of support pool coin name.
   * @return Market pools data.
   */
  public async getMarketPools(poolCoinNames?: SupportPoolCoins[]) {
    return await getMarketPools(this, poolCoinNames);
  }

  /**
   * Get  market pool
   *
   * @param poolCoinName - Specific support pool coin name.
   * @return Market pool data.
   */
  public async getMarketPool(poolCoinName: SupportPoolCoins) {
    return await getMarketPool(this, poolCoinName);
  }

  /**
   * Get market collaterals.
   *
   * @description
   * To obtain all market collaterals at once, it is recommended to use
   * the `queryMarket` method to reduce time consumption.
   *
   * @param collateralCoinNames - Specific an array of support collateral coin name.
   * @return Market collaterals data.
   */
  public async getMarketCollaterals(
    collateralCoinNames?: SupportCollateralCoins[]
  ) {
    return await getMarketCollaterals(this, collateralCoinNames);
  }

  /**
   * Get market collateral
   *
   * @param collateralCoinName - Specific support collateral coin name.
   * @return Market collateral data.
   */
  public async getMarketCollateral(collateralCoinName: SupportCollateralCoins) {
    return await getMarketCollateral(this, collateralCoinName);
  }

  /**
   * Get obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data.
   */
  public async getObligations(ownerAddress?: string) {
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
    ownerAddress?: string
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
    ownerAddress?: string
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
    ownerAddress?: string
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
    ownerAddress?: string
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

  /* ==================== Spool Query Methods ==================== */

  /**
   * Get spools data.
   *
   * @param stakeMarketCoinNames - Specific an array of support stake market coin name.
   * @return Spools data.
   */
  public async getSpools(stakeMarketCoinNames?: SupportStakeMarketCoins[]) {
    return await getSpools(this, stakeMarketCoinNames);
  }

  /**
   * Get spool data.
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @return Spool data.
   */
  public async getSpool(stakeMarketCoinName: SupportStakeMarketCoins) {
    return await getSpool(this, stakeMarketCoinName);
  }

  /**
   * Get stake accounts data for all stake pools (spools).
   *
   * @param ownerAddress - The owner address.
   * @return All Stake accounts data.
   */
  public async getAllStakeAccounts(ownerAddress?: string) {
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
    ownerAddress?: string
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
  public async getStakePools(stakeMarketCoinNames?: SupportStakeMarketCoins[]) {
    stakeMarketCoinNames = stakeMarketCoinNames ?? [...SUPPORT_SPOOLS];
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
    stakeMarketCoinNames?: SupportStakeMarketCoins[]
  ) {
    stakeMarketCoinNames = stakeMarketCoinNames ?? [...SUPPORT_SPOOLS];
    const stakeRewardPools: StakeRewardPools = {};
    for (const stakeMarketCoinName of stakeMarketCoinNames) {
      const stakeRewardPool = await getStakeRewardPool(
        this,
        stakeMarketCoinName
      );

      if (stakeRewardPool) {
        stakeRewardPools[stakeMarketCoinName] = stakeRewardPool;
      }
    }

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
   * @return Borrow incentive pools data.
   */
  public async getBorrowIncentivePools(
    coinNames?: SupportBorrowIncentiveCoins[]
  ) {
    return await queryBorrowIncentivePools(this, coinNames);
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
   * @return All lending and spool infomation.
   */
  public async getLendings(
    poolCoinNames?: SupportPoolCoins[],
    ownerAddress?: string
  ) {
    return await getLendings(this, poolCoinNames, ownerAddress);
  }

  /**
   * Get user lending and spool information for specific pool.
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param ownerAddress - The owner address.
   * @return Lending pool data.
   */
  public async getLending(
    poolCoinName: SupportPoolCoins,
    ownerAddress?: string
  ) {
    return await getLending(this, poolCoinName, ownerAddress);
  }

  /**
   * Get user all obligation accounts information.
   *
   * @description
   * All collateral and borrowing information in all obligation accounts owned by the user.
   *
   * @param ownerAddress - The owner address.
   * @return All obligation accounts information.
   */
  public async getObligationAccounts(ownerAddress?: string) {
    return await getObligationAccounts(this, ownerAddress);
  }

  /**
   * Get obligation account information for specific id.
   *
   * @description
   * borrowing and obligation information for specific pool.
   *
   * @param obligationId - The obligation id.
   * @param ownerAddress - The owner address.
   * @return Borrowing and collateral information.
   */
  public async getObligationAccount(
    obligationId: string,
    ownerAddress?: string
  ) {
    return await getObligationAccount(this, obligationId, ownerAddress);
  }

  /**
   * Get total value locked.
   *
   * @description
   * Include total supplied value and total borrowed value.
   *
   * @return Total value locked.
   */
  public async getTvl() {
    return await getTotalValueLocked(this);
  }
}
