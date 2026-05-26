/**
 * Static manifest of method names contributed by each tx-block module.
 *
 * Used for:
 *  - collision detection across modules
 *  - unit tests that verify declared methods exist at runtime
 *
 * Keep in sync with `src/types/builder/*.ts` declarations.
 */

export const CORE_NORMAL_METHODS = [
  'openObligation',
  'returnObligation',
  'openObligationEntry',
  'addCollateral',
  'depositCollateral',
  'takeCollateral',
  'deposit',
  'supply',
  'depositEntry',
  'withdraw',
  'withdrawEntry',
  'borrow',
  'borrowWithReferral',
  'borrowEntry',
  'repay',
  'borrowFlashLoan',
  'repayFlashLoan',
  'liquidate',
] as const;

export const CORE_QUICK_METHODS = [
  'addCollateralQuick',
  'depositCollateralQuick',
  'takeCollateralQuick',
  'borrowQuick',
  'borrowWithReferralQuick',
  'depositQuick',
  'supplyQuick',
  'withdrawQuick',
  'repayQuick',
  'updateAssetPricesQuick',
  'liquidateQuick',
] as const;

export const SPOOL_METHODS = [
  'createStakeAccount',
  'stake',
  'unstake',
  'claim',
  'stakeQuick',
  'unstakeQuick',
  'claimQuick',
] as const;

export const BORROW_INCENTIVE_METHODS = [
  'stakeObligation',
  'stakeObligationWithVesca',
  'unstakeObligation',
  'claimBorrowIncentive',
  'deactivateBoost',
  'stakeObligationQuick',
  'stakeObligationWithVeScaQuick',
  'unstakeObligationQuick',
  'claimBorrowIncentiveQuick',
] as const;

export const VESCA_METHODS = [
  'lockSca',
  'extendLockPeriod',
  'extendLockAmount',
  'renewExpiredVeSca',
  'redeemSca',
  'mintEmptyVeSca',
  'splitVeSca',
  'mergeVeSca',
  'lockScaQuick',
  'extendLockPeriodQuick',
  'extendLockAmountQuick',
  'renewExpiredVeScaQuick',
  'redeemScaQuick',
  'splitVeScaQuick',
  'mergeVeScaQuick',
] as const;

export const REFERRAL_METHODS = [
  'bindToReferral',
  'claimReferralTicket',
  'burnReferralTicket',
  'claimReferralRevenue',
  'unbindReferral',
  'claimReferralRevenueQuick',
] as const;

export const LOYALTY_METHODS = [
  'claimLoyaltyRevenue',
  'claimVeScaLoyaltyReward',
  'claimLoyaltyRevenueQuick',
  'claimVeScaLoyaltyRewardQuick',
] as const;

export const SCOIN_METHODS = [
  'mintSCoin',
  'burnSCoin',
  'mintSCoinQuick',
  'burnSCoinQuick',
] as const;

export type TxBlockModuleName =
  | 'core.normal'
  | 'core.quick'
  | 'spool'
  | 'borrowIncentive'
  | 'vesca'
  | 'referral'
  | 'loyalty'
  | 'sCoin';

export type TxBlockManifest = Record<TxBlockModuleName, readonly string[]>;

export const TX_BLOCK_MANIFEST: TxBlockManifest = {
  'core.normal': CORE_NORMAL_METHODS,
  'core.quick': CORE_QUICK_METHODS,
  spool: SPOOL_METHODS,
  borrowIncentive: BORROW_INCENTIVE_METHODS,
  vesca: VESCA_METHODS,
  referral: REFERRAL_METHODS,
  loyalty: LOYALTY_METHODS,
  sCoin: SCOIN_METHODS,
};

/**
 * Method names allowed to appear in more than one manifest (none today).
 */
export const ALLOWED_COLLISIONS: ReadonlySet<string> = new Set<string>([]);

export type ManifestCollision = {
  method: string;
  modules: TxBlockModuleName[];
};

export const detectManifestCollisions = (
  manifest: TxBlockManifest = TX_BLOCK_MANIFEST,
  allowed: ReadonlySet<string> = ALLOWED_COLLISIONS
): ManifestCollision[] => {
  const seen = new Map<string, TxBlockModuleName[]>();
  for (const [moduleName, methods] of Object.entries(manifest) as [
    TxBlockModuleName,
    readonly string[],
  ][]) {
    for (const method of methods) {
      const existing = seen.get(method) ?? [];
      existing.push(moduleName);
      seen.set(method, existing);
    }
  }
  const collisions: ManifestCollision[] = [];
  for (const [method, modules] of seen.entries()) {
    if (modules.length > 1 && !allowed.has(method)) {
      collisions.push({ method, modules });
    }
  }
  return collisions;
};
