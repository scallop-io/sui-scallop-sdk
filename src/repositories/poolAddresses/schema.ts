import { z } from 'zod';

const AcTableSchema = z.object({
  id: z.string(),
  keys: z.nullable(z.object({ contents: z.array(z.string()) })),
  table: z.object({ id: z.string(), size: z.string() }),
  with_keys: z.boolean(),
});

const BagSchema = z.object({
  id: z.string(),
  size: z.string(),
});

export const MarketObjectJsonSchema = z.object({
  asset_active_states: z.object({
    base: AcTableSchema,
    collateral: AcTableSchema,
  }),
  borrow_dynamics: AcTableSchema,
  collateral_stats: AcTableSchema,
  id: z.string(),
  interest_models: AcTableSchema,
  limiters: AcTableSchema,
  reward_factors: AcTableSchema,
  risk_models: AcTableSchema,
  vault: z.object({
    balance_sheets: AcTableSchema,
    flash_loan_fees: AcTableSchema,
    id: z.string(),
    market_coin_supplies: BagSchema,
    underlying_balances: BagSchema,
  }),
});
