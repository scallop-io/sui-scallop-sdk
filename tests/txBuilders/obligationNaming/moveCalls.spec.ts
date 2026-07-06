import { describe, expect, it, vi } from 'vitest';
import { generateObligationNamingNormalMethod } from 'src/txBuilders/obligationNaming/moveCalls.js';

/**
 * Unit coverage for the obligation-naming domain — the two normal (pure
 * Move-call) methods. Each is a thin wrapper that should build one `moveCall`
 * with the right target and argument order. We inject a fake `MoveCallContext`
 * whose `moveCall` records its arguments, and a fake txBlock whose
 * `pure.string` is identity-traceable.
 */

const IDS: Record<string, string> = {
  'obligationNaming.id': 'PKG',
  'obligationNaming.namingRegistry': 'REGISTRY',
};

const makeCtx = () => ({
  address: { get: (k: string) => IDS[k] ?? k },
  moveCall: vi.fn(() => 'RESULT'),
});

const makeTxBlock = () => ({
  pure: { string: (s: string) => ({ string: s }) },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const make = (ctx: any, txBlock: any) =>
  generateObligationNamingNormalMethod({
    ctx,
    txBlock,
  } as unknown as Parameters<typeof generateObligationNamingNormalMethod>[0]);

// Reads the (target, args, typeArgs) of the Nth recorded moveCall.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = (ctx: any, n = 0) => {
  const c = ctx.moveCall.mock.calls[n];
  return { target: c[1], args: c[2], typeArgs: c[3] };
};

describe('obligation-naming normal methods', () => {
  it('setObligationName targets obligation_naming::set_name with [registry, key, pure(name)]', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).setObligationName('KEY', 'my-obligation');

    const { target, args, typeArgs } = call(ctx);
    expect(target).toBe('PKG::obligation_naming::set_name');
    expect(args).toEqual(['REGISTRY', 'KEY', { string: 'my-obligation' }]);
    expect(typeArgs).toEqual([]);
  });

  it('removeObligationName targets obligation_naming::remove_name with [registry, key]', () => {
    const ctx = makeCtx();
    make(ctx, makeTxBlock()).removeObligationName('KEY');

    const { target, args, typeArgs } = call(ctx);
    expect(target).toBe('PKG::obligation_naming::remove_name');
    expect(args).toEqual(['REGISTRY', 'KEY']);
    expect(typeArgs).toEqual([]);
  });

  it('reads the package id and naming registry from the address context', () => {
    const ctx = makeCtx();
    const getSpy = vi.spyOn(ctx.address, 'get');
    make(ctx, makeTxBlock());

    expect(getSpy).toHaveBeenCalledWith('obligationNaming.id');
    expect(getSpy).toHaveBeenCalledWith('obligationNaming.namingRegistry');
  });
});
