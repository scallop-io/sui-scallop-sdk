/**
 * Internal-only DTO types — raw on-chain JSON shapes and the
 * intermediate parsed / calculated views built from them.
 *
 * Re-exported from their current `src/types/query/*` locations to establish
 * a single internal import path. Public-surface back-compat is preserved
 * via the existing exports in `src/types/query/*` (they continue to be
 * re-exported through `src/types/public/index.ts`). Internal code should
 * prefer `import { ... } from 'src/types/internal/index.js'` (or the more
 * specific `'src/types/internal/dto.js'`) to keep the boundary visible.
 *
 * Anything reachable from here is NOT governed by semver — these shapes
 * track on-chain payloads and parser internals and may change without a
 * major bump. Consumers that want to do their own parsing should rely on
 * the higher-level types in `src/types/query/*` or on the mapper output
 * types directly.
 */
export type {
  OriginMarketPoolData,
  ParsedMarketPoolData,
  CalculatedMarketPoolData,
  OriginMarketCollateralData,
  ParsedMarketCollateralData,
  CalculatedMarketCollateralData,
} from '../../repositories/market/types.js';

export type {
  OriginSpoolData,
  ParsedSpoolData,
  CalculatedSpoolData,
  OriginSpoolRewardPoolData,
  ParsedSpoolRewardPoolData,
  CalculatedSpoolRewardPoolData,
} from '../../repositories/spool/types.js';

export type {
  OriginBorrowIncentivePoolPointData,
  OriginBorrowIncentivePoolData,
  ParsedBorrowIncentivePoolPointData,
  ParsedBorrowIncentivePoolData,
  CalculatedBorrowIncentivePoolPointData,
  OriginBorrowIncentiveAccountPoolData,
  OriginBorrowIncentiveAccountData,
  ParsedBorrowIncentiveAccountPoolData,
  ParsedBorrowIncentiveAccountData,
} from '../../repositories/borrowIncentive/types.js';
