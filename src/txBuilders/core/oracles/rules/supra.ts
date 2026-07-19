import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type { SupportOracleType } from 'src/types/index.js';
import { BaseOracleRule, type SetPriceParams } from './types.js';

/**
 * Supra oracle rule. Uses the default `set_price_as_<ruleType>` target; feeds a
 * holder + registry object.
 */
export class SupraOracleRule extends BaseOracleRule {
  readonly type: SupportOracleType = 'supra';

  protected packageId(): string {
    return this.ctx.address.get('core.packages.supra.id');
  }

  protected priceArgs(_params: SetPriceParams): SuiObjectArg[] {
    return [
      this.ctx.address.get('core.oracles.supra.holder'),
      this.ctx.address.get('core.oracles.supra.registry'),
    ];
  }
}
