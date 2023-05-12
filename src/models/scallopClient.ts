import { SuiKit } from '@scallop-io/sui-kit';

/**
 * ### Scallop Client
 *
 * it provides contract interaction operations for general users.
 *
 * #### Usage
 *
 * ```typescript
 * const clent  = new Scallop(<parameters>);
 * client.<depoist>();
 * ```
 */
export class ScallopClient {
  private _suiKit: SuiKit;

  public constructor(suiKit: SuiKit) {
    this._suiKit = suiKit;
  }

  public async queryMarket() {}

  public async queryObligation() {}

  public async openObligation() {}

  public async openObligationAndAddCollateral() {}

  public async depositl() {}
  public async withdraw() {}
  public async borrow() {}
  public async repay() {}
  public async depositCollateral() {}

  public async withdrawCollateral() {}
}
