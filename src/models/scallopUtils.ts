import {
  SUI_FRAMEWORK_ADDRESS,
  SUI_TYPE_ARG,
  normalizeStructTag,
} from '@mysten/sui.js';
import { SuiKit } from '@scallop-io/sui-kit';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import type { ScallopParams, SupportCoins } from '../types';

/**
 * ### Scallop Utils
 *
 * Integrates some helper functions frequently used in interactions with the Scallop contract.
 *
 * #### Usage
 *
 * ```typescript
 * const utils  = new ScallopUtils(<parameters>);
 * utils.<help functions>();
 * ```
 */
export class ScallopUtils {
  private _suiKit: SuiKit;

  public constructor(params: ScallopParams) {
    this._suiKit = new SuiKit(params);
  }

  /**
   * @description Select coin id  that add up to the given amount as transaction arguments.
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
   * @description Fetch price feed VAAs of interest from the Pyth.
   * @param priceIds Array of hex-encoded price ids.
   * @param isTestnet Specify whether it is a test network.
   * @return Array of base64 encoded VAAs.
   */
  public async getVaas(priceIds: string[], isTestnet?: boolean) {
    const connection = new PriceServiceConnection(
      isTestnet
        ? 'https://xc-testnet.pyth.network'
        : 'https://xc-mainnet.pyth.network',
      {
        priceFeedRequestConfig: {
          binary: true,
        },
      }
    );
    return await connection.getLatestVaas(priceIds);
  }

  /**
   * @description Handle non-standard coins.
   * @param coinPackageId Package id of coin.
   * @param coinName specific support coin name.
   * @return coinType.
   */
  public parseCoinType(coinPackageId: string, coinName: string) {
    if (coinName === 'sui') return normalizeStructTag(SUI_TYPE_ARG);
    const wormHoleCoins = [
      // USDC
      '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
      // USDT
      '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
    ];
    if (wormHoleCoins.includes(coinPackageId)) {
      return `${coinPackageId}::coin::COIN`;
    } else {
      return `${coinPackageId}::${coinName}::${coinName.toUpperCase()}`;
    }
  }

  /**
   * @description Handle non-standard coin names.
   * @param coinPackageId Package id of coin.
   * @param coinName specific support coin name.
   * @return coinType.
   */
  public getCoinNameFromCoinType(coinType: string) {
    const wormHoleCoinTypes = [
      // USDC
      '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
      // USDT
      '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    ];

    if (coinType === wormHoleCoinTypes[0]) {
      return 'usdc';
    } else if (coinType === wormHoleCoinTypes[1]) {
      return 'usdt';
    } else {
      return coinType.split('::')[2].toLowerCase() as SupportCoins;
    }
  }

  /**
   * @description Handle market coin types.
   *
   * @param coinPackageId Package id of coin.
   * @param protocolPkgId Package id of protocol.
   * @param coinName specific support coin name.
   *
   * @return marketCoinType.
   */
  public parseMarketCoinType(
    coinPackageId: string,
    protocolPkgId: string,
    coinName: string
  ) {
    const coinType = this.parseCoinType(
      coinName === 'sui' ? SUI_FRAMEWORK_ADDRESS : coinPackageId,
      coinName
    );
    return `${protocolPkgId}::reserve::MarketCoin<${coinType}>`;
  }
}
