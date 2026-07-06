import type { CoreNormalMethods, CoreQuickMethods } from './core.js';
import type { SpoolNormalMethods, SpoolQuickMethods } from './spool.js';
import type {
  BorrowIncentiveNormalMethods,
  BorrowIncentiveQuickMethods,
} from './borrowIncentive.js';
import type { VeScaNormalMethods, VeScaQuickMethods } from './vesca.js';
import type {
  ReferralNormalMethods,
  ReferralQuickMethods,
} from './referral.js';
import type {
  LoyaltyProgramNormalMethods,
  LoyaltyProgramQuickMethods,
} from './loyaltyProgram.js';
import type { sCoinNormalMethods, sCoinQuickMethods } from './sCoin.js';
import type { ObligationNamingNormalMethods } from './obligationNaming.js';

/**
 * Per-domain method bundles. Each bundle is the union of a module's normal
 * and quick methods, without SuiTxBlock/runtime-proxy noise.
 *
 * Used by the explicit composite API on `ScallopTxBlock`:
 *
 *   tx.core.supply(...)
 *   tx.spool.stake(...)
 *   tx.vesca.lockSca(...)
 *
 * The flat methods (`tx.supply`, `tx.stake`, …) remain available as a
 * compatibility layer.
 */
export type CoreModule = CoreNormalMethods & CoreQuickMethods;
export type SpoolModule = SpoolNormalMethods & SpoolQuickMethods;
export type BorrowIncentiveModule = BorrowIncentiveNormalMethods &
  BorrowIncentiveQuickMethods;
export type VeScaModule = VeScaNormalMethods & VeScaQuickMethods;
export type ReferralModule = ReferralNormalMethods & ReferralQuickMethods;
export type LoyaltyModule = LoyaltyProgramNormalMethods &
  LoyaltyProgramQuickMethods;
export type SCoinModule = sCoinNormalMethods & sCoinQuickMethods;
export type ObligationNamingModule = ObligationNamingNormalMethods;

export interface ScallopTxBlockModules {
  readonly core: CoreModule;
  readonly spool: SpoolModule;
  readonly borrowIncentive: BorrowIncentiveModule;
  readonly vesca: VeScaModule;
  readonly referral: ReferralModule;
  readonly loyalty: LoyaltyModule;
  readonly sCoin: SCoinModule;
  readonly obligationNaming: ObligationNamingModule;
}
