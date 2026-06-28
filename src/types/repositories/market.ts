// Public result types owned by the `market` repository. Re-exported (single
// source of truth) — internal DTOs (`Origin*`/`Parsed*`/`Calculated*`,
// `MarketQueryInterface`, raw Move-object shapes) stay in the repo and are
// reachable only via `src/types/internal/`.
export type {
  MarketPool,
  MarketCollateral,
  MarketPools,
  MarketCollaterals,
  Market,
  Markets,
  TotalValueLocked,
} from 'src/repositories/market/types.js';
