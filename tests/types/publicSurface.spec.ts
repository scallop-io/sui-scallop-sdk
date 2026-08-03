import { describe, it, expectTypeOf } from 'vitest';
import type { ScallopQuery } from 'src/models/index.js';
// Import EVERY public result type from the consumer-facing barrel (the `.` /
// `/types` entry). If any of these is not re-exported from the public surface,
// THIS IMPORT FAILS TO COMPILE — which is exactly the regression that let
// `TotalValueLocked` leak (returned by a public method but not exported).
import type {
  // market (repo-owned)
  MarketPool,
  MarketCollateral,
  MarketPools,
  MarketCollaterals,
  Market,
  Markets,
  TotalValueLocked,
  // spool (repo-owned)
  Spool,
  Spools,
  // borrowIncentive (repo-owned)
  BorrowIncentivePools,
  BorrowIncentiveAccounts,
  // veSca / loyalty (repo-owned)
  VeSca,
  Vesca,
  VeScaTreasuryInfo,
  LoyaltyProgramInfo,
  VeScaLoyaltyProgramInfo,
  // query-layer assembly
  Lendings,
  Lending,
  ObligationAccount,
} from 'src/types/index.js';

/**
 * Awaited return type of a `ScallopQuery` method, with `undefined` stripped.
 * `Extract` (not a bare `ScallopQuery[M]`) because `ScallopQuery` is generic
 * over its read transport: the indexed access stays deferred, so the outer
 * `extends` check no longer proves callability to `ReturnType`.
 */
type Result<M extends keyof ScallopQuery> = ScallopQuery[M] extends (
  ...args: never[]
) => unknown
  ? NonNullable<
      Awaited<
        ReturnType<Extract<ScallopQuery[M], (...args: never[]) => unknown>>
      >
    >
  : never;

// These are compile-time assertions; the bodies are erased at runtime. They are
// validated by `pnpm test:typecheck` (tsc over tests/) and run as no-ops here.
describe('public type surface', () => {
  it('exposes every public ScallopQuery result type from the public barrel', () => {
    // Each method's result type must conform to the publicly-exported type.
    expectTypeOf<Result<'getMarketPools'>>().toExtend<MarketPools>();
    expectTypeOf<Result<'getMarketPool'>>().toExtend<MarketPool>();
    expectTypeOf<
      Result<'getMarketCollaterals'>
    >().toExtend<MarketCollaterals>();
    expectTypeOf<Result<'getMarketCollateral'>>().toExtend<MarketCollateral>();
    expectTypeOf<Result<'getTvl'>>().toExtend<TotalValueLocked>();
    expectTypeOf<Result<'getSpools'>>().toExtend<Spools>();
    expectTypeOf<Result<'getSpool'>>().toExtend<Spool>();
    expectTypeOf<
      Result<'getBorrowIncentivePools'>
    >().toExtend<BorrowIncentivePools>();
    expectTypeOf<
      Result<'getBorrowIncentiveAccounts'>
    >().toExtend<BorrowIncentiveAccounts>();
    expectTypeOf<Result<'getVeSca'>>().toExtend<VeSca>();
    expectTypeOf<
      Result<'getVeScaTreasuryInfo'>
    >().toExtend<VeScaTreasuryInfo>();
    expectTypeOf<
      Result<'getLoyaltyProgramInfos'>
    >().toExtend<LoyaltyProgramInfo>();
    expectTypeOf<
      Result<'getVeScaLoyaltyProgramInfos'>
    >().toExtend<VeScaLoyaltyProgramInfo>();
    expectTypeOf<Result<'getLendings'>>().toExtend<Lendings>();
    expectTypeOf<Result<'getLending'>>().toExtend<Lending>();
    expectTypeOf<
      Result<'getObligationAccount'>
    >().toExtend<ObligationAccount>();

    // Aggregate/alias types must remain importable from the public barrel even
    // when no single method returns exactly them.
    expectTypeOf<Market>().not.toBeAny();
    expectTypeOf<Markets>().not.toBeAny();
    expectTypeOf<Vesca>().toEqualTypeOf<VeSca>(); // back-compat alias

    expectTypeOf(true).toEqualTypeOf<boolean>();
  });
});
