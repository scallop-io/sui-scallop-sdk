import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type { SupportOracleType, xOracleRuleType } from 'src/types/index.js';
import { BaseOracleRule, type SetPriceParams } from './types.js';

/**
 * Switchboard oracle rule. Differs from the shared default in target naming
 * (`set_as_<ruleType>_price`, not `set_price_as_<ruleType>`); feeds a per-coin
 * aggregator + registry object.
 */
export class SwitchboardOracleRule extends BaseOracleRule {
  readonly type: SupportOracleType = 'switchboard';

  protected packageId(): string {
    return this.ctx.address.get('core.packages.switchboard.id');
  }

  protected override target(ruleType: xOracleRuleType): string {
    return `${this.packageId()}::rule::set_as_${ruleType}_price`;
  }

  protected priceArgs({ assetCoinName }: SetPriceParams): SuiObjectArg[] {
    return [
      this.ctx.address.get(`core.coins.${assetCoinName}.oracle.switchboard`),
      this.ctx.address.get('core.oracles.switchboard.registry'),
    ];
  }
}
