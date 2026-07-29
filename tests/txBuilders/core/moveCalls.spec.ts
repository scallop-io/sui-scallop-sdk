import { describe, expect, it, vi } from 'vitest';
import { generateCoreNormalMethod } from 'src/txBuilders/core/moveCalls.js';

/**
 * Unit coverage for the core *normal* (pure Move-call) methods. Each method is a
 * thin wrapper that should build one `moveCall` with the right target, argument
 * order, and type arguments. We inject a fake `MoveCallContext` whose `moveCall`
 * records its arguments, and assert the constructed call.
 */

const IDS: Record<string, string> = {
  'core.packages.protocol.id': 'PKG',
  'core.market': 'MARKET',
  'core.version': 'VERSION',
  'core.coinDecimalsRegistry': 'REGISTRY',
  'core.oracles.xOracle': 'XORACLE',
  'referral.id': 'REFPKG',
};

const CLOCK = { tag: 'clock' };

const makeCtx = () => ({
  address: { get: (k: string) => IDS[k] ?? k },
  moveCall: vi.fn(() => ['R0', 'R1', 'R2']),
  utils: { parseCoinType: (n: string) => `0x2::${n}::T` },
});

const makeTxBlock = () => ({
  sharedObjectRef: () => CLOCK,
  pure: { u64: (n: number) => ({ u64: n }) },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const make = (ctx: any, txBlock: any) =>
  generateCoreNormalMethod({ ctx, txBlock } as unknown as Parameters<
    typeof generateCoreNormalMethod
  >[0]);

// Reads the (target, args, typeArgs) of the Nth recorded moveCall.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = (ctx: any, n = 0) => {
  const c = ctx.moveCall.mock.calls[n];
  return { target: c[1], args: c[2], typeArgs: c[3] };
};

describe('core normal methods', () => {
  it('openObligation targets open_obligation and returns the [obligation, key, hotPotato] triple', () => {
    const ctx = makeCtx();
    const out = make(ctx, makeTxBlock()).openObligation();

    expect(call(ctx).target).toBe('PKG::open_obligation::open_obligation');
    expect(call(ctx).args).toEqual(['VERSION']);
    expect(out).toEqual(['R0', 'R1', 'R2']);
  });

  it('openObligationEntry targets the entry variant', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).openObligationEntry();
    expect(call(ctx).target).toBe(
      'PKG::open_obligation::open_obligation_entry'
    );
    expect(call(ctx).args).toEqual(['VERSION']);
  });

  it('depositCollateral passes version/obligation/market/coin with the collateral coin type', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).depositCollateral('OBL', 'COIN', 'sui');

    const { target, args, typeArgs } = call(ctx);
    expect(target).toBe('PKG::deposit_collateral::deposit_collateral');
    expect(args).toEqual(['VERSION', 'OBL', 'MARKET', 'COIN']);
    expect(typeArgs).toEqual(['0x2::sui::T']);
  });

  it('supply targets mint::mint with [version, market, coin, clock]', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).supply('COIN', 'sui');

    const { target, args, typeArgs } = call(ctx);
    expect(target).toBe('PKG::mint::mint');
    expect(args).toEqual(['VERSION', 'MARKET', 'COIN', CLOCK]);
    expect(typeArgs).toEqual(['0x2::sui::T']);
  });

  it('withdraw targets redeem::redeem', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).withdraw('MARKETCOIN', 'sui');

    const { target, args } = call(ctx);
    expect(target).toBe('PKG::redeem::redeem');
    expect(args).toEqual(['VERSION', 'MARKET', 'MARKETCOIN', CLOCK]);
  });

  it('borrow includes the decimals registry, amount, xOracle and clock', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).borrow('OBL', 'KEY', 1234, 'sui');

    const { target, args, typeArgs } = call(ctx);
    expect(target).toBe('PKG::borrow::borrow');
    expect(args).toEqual([
      'VERSION',
      'OBL',
      'KEY',
      'MARKET',
      'REGISTRY',
      1234,
      'XORACLE',
      CLOCK,
    ]);
    expect(typeArgs).toEqual(['0x2::sui::T']);
  });

  it('borrowWithReferral appends the referral witness type and pure-encodes a numeric amount', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).borrowWithReferral(
      'OBL',
      'KEY',
      'REF',
      777,
      'sui'
    );

    const { target, args, typeArgs } = call(ctx);
    expect(target).toBe('PKG::borrow::borrow_with_referral');
    expect(args).toContainEqual({ u64: 777 });
    expect(args).toContain('REF');
    expect(typeArgs).toEqual([
      '0x2::sui::T',
      'REFPKG::scallop_referral_program::REFERRAL_WITNESS',
    ]);
  });

  it('repay targets repay::repay', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).repay('OBL', 'COIN', 'sui');

    const { target, args } = call(ctx);
    expect(target).toBe('PKG::repay::repay');
    expect(args).toEqual(['VERSION', 'OBL', 'MARKET', 'COIN', CLOCK]);
  });

  it('takeCollateral pure-encodes the amount and targets withdraw_collateral', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).takeCollateral('OBL', 'KEY', 99, 'sui');

    const { target, args } = call(ctx);
    expect(target).toBe('PKG::withdraw_collateral::withdraw_collateral');
    expect(args).toContainEqual({ u64: 99 });
    expect(args).toContainEqual(CLOCK);
  });

  it('borrowFlashLoan targets flash_loan::borrow_flash_loan', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).borrowFlashLoan(5000, 'sui');

    const { target, args, typeArgs } = call(ctx);
    expect(target).toBe('PKG::flash_loan::borrow_flash_loan');
    expect(args).toEqual(['VERSION', 'MARKET', 5000]);
    expect(typeArgs).toEqual(['0x2::sui::T']);
  });

  it('liquidate carries both debt and collateral coin types and returns the [debt, collateral] pair', () => {
    const ctx = makeCtx();
    const out = make(ctx, makeTxBlock()).liquidate(
      'OBL',
      'COIN',
      'sui',
      'usdc'
    );

    const { target, typeArgs } = call(ctx);
    expect(target).toBe('PKG::liquidate::liquidate');
    expect(typeArgs).toEqual(['0x2::sui::T', '0x2::usdc::T']);
    expect(out).toEqual(['R0', 'R1']);
  });
});
