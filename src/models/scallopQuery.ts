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
} from '../queries';
import {
  ScallopQueryParams,
  ScallopInstanceParams,
  SupportStakeMarketCoins,
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
   * @param forece Whether to force initialization.
   */
  public async init(forece: boolean = false) {
    if (forece || !this.address.getAddresses()) {
      await this.address.read();
    }
    await this.utils.init(forece);
  }

  /**
   * Get market data.
   *
   * @param rateType - How interest rates are calculated.
   * @return Market data.
   */
  public async getMarket(rateType: 'apy' | 'apr' = 'apr') {
    return await queryMarket(this, rateType);
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
   * Get obligation data.
   *
   * @param obligationId - The obligation id.
   * @return Obligation data.
   */
  public async getObligation(obligationId: string) {
    return queryObligation(this, obligationId);
  }

  /**
   * Get stake accounts data for all stake pools.
   *
   * @param ownerAddress - The owner address.
   * @return All Stake accounts data.
   */
  public async getAllStakeAccounts(ownerAddress?: string) {
    return await getStakeAccounts(this, ownerAddress);
  }

  /**
   * Get stake accounts data for specific stake pool.
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
   * Get stake pool data.
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
}
