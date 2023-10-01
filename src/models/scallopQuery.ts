import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { ADDRESSES_ID } from '../constants';
import {
  queryMarket,
  getObligations,
  queryObligation,
  getStakeAccounts,
  getStakePool,
  getRewardPool,
  getPythPrice,
  getMarketPools,
  getMarketPool,
  getMarketCollaterals,
  getMarketCollateral,
  getAllCoinAmount,
  getCoinAmount,
  getAllMarketCoinAmount,
  getMarketCoinAmount,
  getLendings,
} from '../queries';
import {
  ScallopQueryParams,
  ScallopInstanceParams,
  SupportStakeMarketCoins,
  SupportCoins,
  SupportPoolCoins,
  SupportCollateralCoins,
  SupportMarketCoins,
} from '../types';

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

  /**
   * Query market data.
   *
   * @return Market data.
   */
  public async queryMarket() {
    return await queryMarket(this);
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
   * Get stake accounts data for all stake pools (spool).
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
   * @param marketCoinName - Support stake market coin.
   * @param ownerAddress - The owner address.
   * @return Stake accounts data.
   */
  public async getStakeAccounts(
    marketCoinName: SupportStakeMarketCoins,
    ownerAddress?: string
  ) {
    const allStakeAccount = await this.getAllStakeAccounts(ownerAddress);
    return allStakeAccount[marketCoinName];
  }

  /**
   * Get stake pool (spool) data.
   *
   * @param marketCoinName - The market coin name.
   * @return Stake pool data.
   */
  public async getStakePool(marketCoinName: SupportStakeMarketCoins) {
    return await getStakePool(this, marketCoinName);
  }

  /**
   * Get reward pool data.
   *
   * @param marketCoinName - The market coin name.
   * @return Reward pool data.
   */
  public async getRewardPool(marketCoinName: SupportStakeMarketCoins) {
    return await getRewardPool(this, marketCoinName);
  }

  /**
   * Get price from pyth fee object.
   *
   * @param coinName - Specific support coin name.
   * @return Coin price.
   */
  public async getPriceFromPyth(coinName: SupportCoins) {
    return await getPythPrice(this, coinName);
  }

  /**
   * Get market pools.
   *
   * @param coinNames - Specific an array of support coin name.
   * @return Market pools data.
   */
  public async getMarketPools(coinNames?: SupportPoolCoins[]) {
    return await getMarketPools(this, coinNames);
  }

  /**
   * Get  market pool
   *
   * @param coinName - Specific support coin name.
   * @return Market pool data.
   */
  public async getMarketPool(coinName: SupportPoolCoins) {
    return await getMarketPool(this, coinName);
  }

  /**
   * Get market collaterals.
   *
   * @param coinNames - Specific an array of support coin name.
   * @return Market collaterals data.
   */
  public async getMarketCollaterals(coinNames?: SupportCollateralCoins[]) {
    return await getMarketCollaterals(this, coinNames);
  }

  /**
   * Get  market collateral
   *
   * @param coinName - Specific support coin name.
   * @return Market collateral data.
   */
  public async getMarketCollateral(coinName: SupportCollateralCoins) {
    return await getMarketCollateral(this, coinName);
  }

  /**
   * Get all coins amount
   *
   * @param coinNames - Specific an array of support coin name.
   * @param ownerAddress - The owner address.
   * @return All coins amount.
   */
  public async getAllCoinAmount(
    coinNames?: SupportPoolCoins[],
    ownerAddress?: string
  ) {
    return await getAllCoinAmount(this, coinNames, ownerAddress);
  }

  /**
   * Get coin amount
   *
   * @param coinNames - Specific support coin name.
   * @param ownerAddress - The owner address.
   * @return Coin amount.
   */
  public async getCoinAmount(
    coinName: SupportPoolCoins,
    ownerAddress?: string
  ) {
    return await getCoinAmount(this, coinName, ownerAddress);
  }

  /**
   * Get all market coins amount
   *
   * @param coinNames - Specific an array of support market coin name.
   * @param ownerAddress - The owner address.
   * @return All market market coins amount.
   */
  public async getAllMarketCoinAmount(
    marketCoinNames?: SupportMarketCoins[],
    ownerAddress?: string
  ) {
    return await getAllMarketCoinAmount(this, marketCoinNames, ownerAddress);
  }

  /**
   * Get market coin amount
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

  public async getCollaterals() {
    return await getLendings(this);
  }

  public async getBorrowings() {
    return await getLendings(this);
  }
}
