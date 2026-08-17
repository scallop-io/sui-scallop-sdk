import { SuiObjectArg } from '@scallop-io/sui-kit';
import { ScallopTransactionBuildError } from 'src/errors/index.js';
import { BaseOracleRule } from './types.js';
import { SupportedOracleType } from 'src/types/index.js';

/**
 * Special oracle rule for authorized coin types.
 */
export class CustomOracleRule extends BaseOracleRule {
  readonly type: SupportedOracleType = 'custom';

  /**
   * `address.get` resolves a missing path to `undefined`, which would otherwise
   * be spliced into the Move call and fail deep inside tx serialization. Fail
   * loud at build time instead, naming the address path that is missing.
   */
  private required(
    path: 'core.packages.customOracle.id' | 'core.oracles.custom.registry'
  ): string {
    const value = this.ctx.address.get(path);
    if (!value) {
      throw new ScallopTransactionBuildError(
        `custom oracle address not configured: ${path}`,
        { context: { path, oracle: this.type } }
      );
    }
    return value;
  }

  protected packageId(): string {
    return this.required('core.packages.customOracle.id');
  }

  protected priceArgs(): SuiObjectArg[] {
    return [this.required('core.oracles.custom.registry')];
  }
}
