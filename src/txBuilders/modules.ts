import {
  CORE_NORMAL_METHODS,
  CORE_QUICK_METHODS,
  SPOOL_METHODS,
  BORROW_INCENTIVE_METHODS,
  VESCA_METHODS,
  REFERRAL_METHODS,
  LOYALTY_METHODS,
  SCOIN_METHODS,
} from './manifest.js';
import type { ScallopTxBlockModules } from 'src/types/index.js';

/**
 * Build per-domain module views from a composed flat tx block.
 *
 * Method functions inside each builder generator are arrow-function
 * properties that capture `txBlock` via closure (see `coreBuilder.ts`,
 * `spoolBuilder.ts`, etc.), so they do not depend on `this`. Module views
 * therefore just copy the function references off the composed proxy.
 */
const pickMethods = <T>(
  source: Record<string, unknown>,
  names: readonly string[]
): T => {
  const view: Record<string, unknown> = {};
  for (const name of names) {
    const fn = source[name];
    if (typeof fn === 'function') {
      view[name] = fn;
    }
  }
  return Object.freeze(view) as T;
};

export const buildTxBlockModules = (
  composed: object
): ScallopTxBlockModules => {
  const src = composed as Record<string, unknown>;
  return Object.freeze({
    core: pickMethods<ScallopTxBlockModules['core']>(src, [
      ...CORE_NORMAL_METHODS,
      ...CORE_QUICK_METHODS,
    ]),
    spool: pickMethods<ScallopTxBlockModules['spool']>(src, SPOOL_METHODS),
    borrowIncentive: pickMethods<ScallopTxBlockModules['borrowIncentive']>(
      src,
      BORROW_INCENTIVE_METHODS
    ),
    vesca: pickMethods<ScallopTxBlockModules['vesca']>(src, VESCA_METHODS),
    referral: pickMethods<ScallopTxBlockModules['referral']>(
      src,
      REFERRAL_METHODS
    ),
    loyalty: pickMethods<ScallopTxBlockModules['loyalty']>(
      src,
      LOYALTY_METHODS
    ),
    sCoin: pickMethods<ScallopTxBlockModules['sCoin']>(src, SCOIN_METHODS),
  });
};

export const TX_BLOCK_MODULE_KEYS = [
  'core',
  'spool',
  'borrowIncentive',
  'vesca',
  'referral',
  'loyalty',
  'sCoin',
] as const satisfies readonly (keyof ScallopTxBlockModules)[];
