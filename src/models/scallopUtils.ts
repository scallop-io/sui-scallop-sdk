import {
  SUI_FRAMEWORK_ADDRESS,
  SUI_TYPE_ARG,
  normalizeStructTag,
} from '@mysten/sui.js/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopQuery } from './scallopQuery';
import {
  ADDRESSES_ID,
  PROTOCOL_OBJECT_ID,
  scallopRewardType,
} from '../constants';
import { queryObligation } from '../queries';
import type {
  ScallopUtilsParams,
  ScallopInstanceParams,
  SupportCoins,
  SupportStakeMarketCoins,
} from '../types';

/**
 * @description
 * Integrates some helper functions frequently used in interactions with the Scallop contract.
 *
 * @example
 * ```typescript
 * const scallopUtils  = new ScallopUtils(<parameters>);
 * await scallopUtils.init();
 * scallopUtils.<utils functions>();
 * await scallopUtils.<utils functions>();
 * ```
 */
export class ScallopUtils {
  public readonly params: ScallopUtilsParams;
  private _suiKit: SuiKit;
  private _address: ScallopAddress;
  private _query: ScallopQuery;

  public constructor(
    params: ScallopUtilsParams,
    instance?: ScallopInstanceParams
  ) {
    this.params = params;
    this._suiKit = instance?.suiKit ?? new SuiKit(params);
    this._address =
      instance?.address ??
      new ScallopAddress({
        id: params?.addressesId || ADDRESSES_ID,
        network: params?.networkType,
      });
    this._query =
      instance?.query ??
      new ScallopQuery(params, {
        suiKit: this._suiKit,
        address: this._address,
      });
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param forece Whether to force initialization.
   */
  public async init(forece: boolean = false) {
    if (forece || !this._address.getAddresses()) {
      await this._address.read();
    }
    await this._query.init(forece);
  }

  /**
   * Convert coin name to coin type.
   *
   * @description
   * The Coin type of wormhole is fixed `coin:Coin`. Here using package id
   * to determine and return the type.
   *
   * @param coinPackageId Package id of coin.
   * @param coinName Specific support coin name.
   * @return Coin type.
   */
  public parseCoinType(coinPackageId: string, coinName: string) {
    if (coinName === 'sui')
      return normalizeStructTag(`${coinPackageId}::sui::SUI`);
    const wormHoleCoins = [
      this._address.get(`core.coins.usdc.id`),
      this._address.get(`core.coins.usdt.id`),
      this._address.get(`core.coins.eth.id`),
      this._address.get(`core.coins.btc.id`),
      this._address.get(`core.coins.sol.id`),
      this._address.get(`core.coins.apt.id`),
    ];
    if (wormHoleCoins.includes(coinPackageId)) {
      return `${coinPackageId}::coin::COIN`;
    } else {
      return `${coinPackageId}::${coinName}::${coinName.toUpperCase()}`;
    }
  }

  /**
   * Convert coin type to coin name..
   *
   * @description
   * The coin name cannot be obtained directly from the wormhole type. Here
   * the package id is used to determine and return a specific name.
   *
   * @param coinType Specific support coin type.
   * @return Coin Name.
   */
  public parseCoinName(coinType: string) {
    const wormHoleCoinTypes = [
      `${this._address.get(`core.coins.usdc.id`)}::coin::COIN`,
      `${this._address.get(`core.coins.usdt.id`)}::coin::COIN`,
      `${this._address.get(`core.coins.eth.id`)}::coin::COIN`,
      `${this._address.get(`core.coins.btc.id`)}::coin::COIN`,
      `${this._address.get(`core.coins.sol.id`)}::coin::COIN`,
      `${this._address.get(`core.coins.apt.id`)}::coin::COIN`,
    ];

    if (coinType === wormHoleCoinTypes[0]) {
      return 'usdc';
    } else if (coinType === wormHoleCoinTypes[1]) {
      return 'usdt';
    } else if (coinType === wormHoleCoinTypes[2]) {
      return 'eth';
    } else if (coinType === wormHoleCoinTypes[3]) {
      return 'btc';
    } else if (coinType === wormHoleCoinTypes[4]) {
      return 'sol';
    } else if (coinType === wormHoleCoinTypes[5]) {
      return 'apt';
    } else {
      return coinType.split('::')[2].toLowerCase() as SupportCoins;
    }
  }

  /**
   * Convert market coin name to market coin type.
   *
   * @param coinPackageId Package id of coin.
   * @param coinName Specific support coin name.
   * @return Market coin type.
   */
  public parseMarketCoinType(coinPackageId: string, coinName: string) {
    const coinType = this.parseCoinType(
      coinName === 'sui' ? SUI_FRAMEWORK_ADDRESS : coinPackageId,
      coinName
    );
    return `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${coinType}>`;
  }

  /**
   * Select coin id  that add up to the given amount as transaction arguments.
   *
   * @param owner The address of the owner.
   * @param amount The amount that is needed for the coin.
   * @param coinType The coin type, default is 0x2::SUI::SUI.
   * @return The selected transaction coin arguments.
   */
  public async selectCoins(
    owner: string,
    amount: number,
    coinType: string = SUI_TYPE_ARG
  ) {
    const coins = await this._suiKit.suiInteractor.selectCoins(
      owner,
      amount,
      coinType
    );
    return coins.map((c) => c.objectId);
  }

  /**
   * Get reward type of stake pool.
   *
   * @param marketCoinName - Support stake market coin.
   * @return Reward coin name.
   */
  public getRewardCoinName = (marketCoinName: SupportStakeMarketCoins) => {
    return scallopRewardType[marketCoinName];
  };

  /**
   * Get all coin names in the obligation record by obligation id.
   *
   * @description
   * This can often be used to determine which assets in an obligation require
   * price updates before interacting with specific instructions of the Scallop contract.
   *
   * @param obligationId The obligation id.
   * @return Coin Names.
   */
  public async getObligationCoinNames(obligationId: string) {
    const obligation = await queryObligation(this._query, obligationId);
    const collateralCoinTypes = obligation.collaterals.map((collateral) => {
      return `0x${collateral.type.name}`;
    });
    const debtCoinTypes = obligation.debts.map((debt) => {
      return `0x${debt.type.name}`;
    });
    const obligationCoinTypes = [
      ...new Set([...collateralCoinTypes, ...debtCoinTypes]),
    ];
    const obligationCoinNames = obligationCoinTypes.map((coinType) => {
      return this.parseCoinName(coinType);
    });
    return obligationCoinNames;
  }
}
