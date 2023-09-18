import {
  SUI_FRAMEWORK_ADDRESS,
  SUI_TYPE_ARG,
  normalizeStructTag,
} from '@mysten/sui.js';
import { SuiKit } from '@scallop-io/sui-kit';
import { PROTOCOL_OBJECT_ID } from '../constants/common';
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
      // ETH
      '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
      // BTC
      '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
      // SOL
      '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
      // APT
      '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37',
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
      // ETH
      '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
      // BTC
      '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
      // SOL
      '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN',
      // APT
      '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37::coin::COIN',
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
   * @description Handle market coin types.
   *
   * @param coinPackageId Package id of coin.
   * @param coinName specific support coin name.
   *
   * @return marketCoinType.
   */
  public parseMarketCoinType(coinPackageId: string, coinName: string) {
    const coinType = this.parseCoinType(
      coinName === 'sui' ? SUI_FRAMEWORK_ADDRESS : coinPackageId,
      coinName
    );
    return `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${coinType}>`;
  }
}
