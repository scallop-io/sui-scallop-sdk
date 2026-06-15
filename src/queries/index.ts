// Read-layer query modules were migrated to `src/repositories/`. The files
// kept here back the write path (builders) + `ScallopUtils`:
//   coreQuery        → getObligations / getObligationLocked / queryObligation
//   vescaQuery       → getVeSca / getVeScas
//   spoolQuery       → getStakeAccounts (imported directly by spoolBuilder)
//   supply/borrow/isolated → internal deps of coreQuery
export * from './coreQuery.js';
export * from './isolatedAssetQuery.js';
export * from './spoolQuery.js';
export * from './supplyLimitQuery.js';
export * from './vescaQuery.js';
export * from './borrowLimitQuery.js';
