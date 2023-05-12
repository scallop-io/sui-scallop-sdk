import { SuiKit } from '@scallop-io/sui-kit';

/**
 * ### Scallop Admin
 *
 * it  provides contract interaction operations needed for managing the lending market.
 *
 * #### Usage
 *
 * ```typescript
 * const admin  = new ScallopAdmin(<parameters>);
 * client.<initMarket>();
 * ```
 */
export class ScallopAdmin {
  private _suiKit: SuiKit;

  public constructor(suiKit: SuiKit) {
    this._suiKit = suiKit;
  }
}
