import { describe, expect, it, vi } from 'vitest';
import { generateReferralNormalMethod } from 'src/txBuilders/referral/moveCalls.js';
import { generateReferralQuickMethod } from 'src/txBuilders/referral/quick.js';

/**
 * Unit coverage for the referral domain — bind/claim/burn Move calls and the
 * `claimReferralRevenueQuick` orchestration (per-coin claim, merge of matching
 * user coins for non-SUI, batched transfer).
 */

const SENDER = '0xSENDER';
const RPKG = 'RPKG';

describe('referral normal methods', () => {
  const makeCtx = () => ({
    address: { get: (k: string) => (k === 'referral.id' ? RPKG : k) },
    moveCall: vi.fn((..._args: unknown[]) => 'RESULT'),
    utils: { parseCoinType: (n: string) => `T<${n}>` },
  });
  const makeTxBlock = () => ({
    sharedObjectRef: () => ({ tag: 'clock' }),
    pure: { id: (v: string) => ({ id: v }) },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any) =>
    generateReferralNormalMethod({
      ctx,
      txBlock: makeTxBlock(),
    } as unknown as Parameters<typeof generateReferralNormalMethod>[0]);

  it('bindToReferral encodes the veSca key id and targets bind_ve_sca_referrer', () => {
    const ctx = makeCtx();
    make(ctx).bindToReferral('VK');
    const c = ctx.moveCall.mock.calls[0];
    expect(c[1]).toBe(`${RPKG}::referral_bindings::bind_ve_sca_referrer`);
    expect(c[2]).toContainEqual({ id: 'VK' });
  });

  it('claimReferralRevenue targets claim_revenue_with_ve_sca_key with the coin type', () => {
    const ctx = makeCtx();
    const out = make(ctx).claimReferralRevenue('VK', 'usdc');
    const c = ctx.moveCall.mock.calls[0];
    expect(c[1]).toBe(
      `${RPKG}::referral_revenue_pool::claim_revenue_with_ve_sca_key`
    );
    expect(c[3]).toEqual(['T<usdc>']);
    expect(out).toBe('RESULT');
  });

  it('burnReferralTicket targets burn_ve_sca_referral_ticket', () => {
    const ctx = makeCtx();
    make(ctx).burnReferralTicket('TICKET', 'usdc');
    expect(ctx.moveCall.mock.calls[0][1]).toBe(
      `${RPKG}::scallop_referral_program::burn_ve_sca_referral_ticket`
    );
  });

  it('unbindReferral targets unbind_ve_sca_referrer', () => {
    const ctx = makeCtx();
    make(ctx).unbindReferral();
    expect(ctx.moveCall.mock.calls[0][1]).toBe(
      `${RPKG}::referral_bindings::unbind_ve_sca_referrer`
    );
  });
});

describe('referral quick methods', () => {
  const makeTxBlock = () => ({
    getData: () => ({ sender: SENDER }),
    claimReferralRevenue: vi.fn(
      (_vk: unknown, name: string) => `reward:${name}`
    ),
    mergeCoins: vi.fn(),
    transferObjects: vi.fn(),
  });

  const makeCtx = (lending: string[]) => ({
    utils: {
      selectCoins: vi.fn(async () => ['c1', 'c2']),
      parseCoinType: (n: string) => `T<${n}>`,
    },
    constants: { whitelist: { lending: new Set(lending) } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any, txBlock: any) =>
    generateReferralQuickMethod({
      ctx,
      txBlock,
    } as unknown as Parameters<typeof generateReferralQuickMethod>[0]);

  it('claims each coin, merges matching user coins for non-SUI, and transfers all rewards', async () => {
    const ctx = makeCtx(['sui', 'usdc']);
    const tx = makeTxBlock();
    await make(ctx, tx).claimReferralRevenueQuick('VK', ['sui', 'usdc']);

    expect(tx.claimReferralRevenue).toHaveBeenCalledTimes(2);
    // SUI takes the simple path (no coin merge); usdc merges matching coins
    expect(ctx.utils.selectCoins).toHaveBeenCalledTimes(1);
    expect(tx.mergeCoins).toHaveBeenCalledWith('reward:usdc', ['c1', 'c2']);
    expect(tx.transferObjects).toHaveBeenCalledWith(
      ['reward:sui', 'reward:usdc'],
      SENDER
    );
  });
});
