import { SUI_TYPE_ARG } from '@mysten/sui.js';
import { SuiKit } from '@scallop-io/sui-kit';
import type { ScallopParams } from '../types';

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
    const coins = await this._suiKit.rpcProvider.selectCoins(
      owner,
      amount,
      coinType
    );
    return coins.map((c) => c.objectId);
  }
}
