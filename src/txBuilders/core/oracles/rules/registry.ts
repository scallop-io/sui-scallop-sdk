import type { SupportOracleType } from 'src/types/index.js';
import type { OracleRule, OracleRuleContext } from './types.js';
import { PythOracleRule } from './pyth.js';
import { SupraOracleRule } from './supra.js';
import { SwitchboardOracleRule } from './switchboard.js';

/**
 * Build the provider registry keyed by {@link SupportOracleType}. Adding a new
 * oracle = one line here plus its rule class — the orchestrator dispatches by
 * lookup, never by `if/else`.
 */
export const buildOracleRuleRegistry = (
  ctx: OracleRuleContext
): Map<SupportOracleType, OracleRule> =>
  new Map<SupportOracleType, OracleRule>([
    ['pyth', new PythOracleRule(ctx)],
    ['supra', new SupraOracleRule(ctx)],
    ['switchboard', new SwitchboardOracleRule(ctx)],
  ]);
