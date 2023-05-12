import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './addressBuilder';
import { ScallopTxBuilder } from './txBuilder';

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
  private _address: ScallopAddress;
  private _txBuilder: ScallopTxBuilder;

  public constructor(
    suiKit: SuiKit,
    address: ScallopAddress,
    txBuilder: ScallopTxBuilder
  ) {
    this._suiKit = suiKit;
    this._address = address;
    this._txBuilder = txBuilder;
  }

  /**
   * Query market data.
   *
   * @return Market data
   */
  public async queryMarket() {
    const queryTxn = this._txBuilder.queryMarket(
      this._address.get('core.packages.query.id'),
      this._address.get('core.market')
    );
    const queryResult = await this._suiKit.inspectTxn(queryTxn);
    const queryData = queryResult.events[0].parsedJson;
    return queryData;
  }

  /**
   * Query obligation data.
   *
   * @return Obligation data
   */
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
