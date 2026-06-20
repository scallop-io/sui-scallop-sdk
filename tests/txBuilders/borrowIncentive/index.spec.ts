import { describe, expect, it, vi } from 'vitest';
import { generateBorrowIncentiveNormalMethod } from 'src/txBuilders/borrowIncentive/moveCalls.js';
import { generateBorrowIncentiveQuickMethod } from 'src/txBuilders/borrowIncentive/quick.js';

/**
 * Unit coverage for the borrow-incentive domain. The quick methods carry the
 * trickiest logic in the builders layer: they resolve obligation lock state and
 * *introspect prior tx commands* to decide whether to (re)stake. Both branches
 * are exercised here with a recording tx-block + fake reads.
 */

const SENDER = '0xSENDER';
const BIPKG = 'BIPKG';

const addressGet = (k: string) => (k === 'borrowIncentive.id' ? BIPKG : k);

describe('borrow-incentive normal methods', () => {
  const makeCtx = () => ({
    address: { get: addressGet },
    moveCall: vi.fn((..._args: unknown[]) => 'RESULT'),
    utils: { parseCoinType: (n: string) => `T<${n}>` },
  });
  const makeTxBlock = () => ({ sharedObjectRef: () => ({ tag: 'clock' }) });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any) =>
    generateBorrowIncentiveNormalMethod({
      ctx,
      txBlock: makeTxBlock(),
    } as unknown as Parameters<typeof generateBorrowIncentiveNormalMethod>[0]);

  it('stakeObligation targets user::stake with key before id', () => {
    const ctx = makeCtx();
    make(ctx).stakeObligation('OB', 'KEY');
    const c = ctx.moveCall.mock.calls[0];
    expect(c[1]).toBe(`${BIPKG}::user::stake`);
    // [config, incentivePools, incentiveAccounts, obligationKey, obligationId, ...]
    const args = c[2] as unknown[];
    expect(args[3]).toBe('KEY');
    expect(args[4]).toBe('OB');
  });

  it('unstakeObligation targets user::unstake_v2', () => {
    const ctx = makeCtx();
    make(ctx).unstakeObligation('OB', 'KEY');
    expect(ctx.moveCall.mock.calls[0][1]).toBe(`${BIPKG}::user::unstake_v2`);
  });

  it('stakeObligationWithVesca targets stake_with_ve_sca_v2', () => {
    const ctx = makeCtx();
    make(ctx).stakeObligationWithVesca('OB', 'KEY', 'VK');
    expect(ctx.moveCall.mock.calls[0][1]).toBe(
      `${BIPKG}::user::stake_with_ve_sca_v2`
    );
  });

  it('claimBorrowIncentive targets redeem_rewards with the reward coin type', () => {
    const ctx = makeCtx();
    const out = make(ctx).claimBorrowIncentive('OB', 'KEY', 'sui');
    const c = ctx.moveCall.mock.calls[0];
    expect(c[1]).toBe(`${BIPKG}::user::redeem_rewards`);
    expect(c[3]).toEqual(['T<sui>']);
    expect(out).toBe('RESULT');
  });

  it('deactivateBoost targets deactivate_boost_v2', () => {
    const ctx = makeCtx();
    make(ctx).deactivateBoost('OB', 'VK');
    expect(ctx.moveCall.mock.calls[0][1]).toBe(
      `${BIPKG}::user::deactivate_boost_v2`
    );
  });
});

describe('borrow-incentive quick methods', () => {
  const unstakeCommand = {
    $kind: 'MoveCall',
    MoveCall: { package: BIPKG, module: 'user', function: 'unstake_v2' },
  };

  const makeTxBlock = (commands: unknown[] = []) => ({
    getData: () => ({ sender: SENDER }),
    txBlock: { getData: () => ({ commands }) },
    stakeObligation: vi.fn(),
    stakeObligationWithVesca: vi.fn(),
    unstakeObligation: vi.fn(),
    claimBorrowIncentive: vi.fn(() => 'reward'),
  });

  const makeCtx = (locked: boolean, bindedVeScaKey?: string) => ({
    address: { get: addressGet },
    reads: {
      getObligations: vi.fn(async () => [{ id: 'OB', keyId: 'KEY', locked }]),
      getObligationLocked: vi.fn(async () => locked),
      getBindedVeScaKey: vi.fn(async () => bindedVeScaKey),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any, txBlock: any) =>
    generateBorrowIncentiveQuickMethod({
      ctx,
      txBlock,
    } as unknown as Parameters<typeof generateBorrowIncentiveQuickMethod>[0]);

  describe('stakeObligationQuick', () => {
    it('stakes when the obligation is not locked', async () => {
      const ctx = makeCtx(false);
      const tx = makeTxBlock();
      await make(ctx, tx).stakeObligationQuick('OB', 'KEY');
      expect(tx.stakeObligation).toHaveBeenCalledWith('OB', 'KEY');
    });

    it('does NOT stake a locked obligation with no prior unstake command', async () => {
      const ctx = makeCtx(true);
      const tx = makeTxBlock();
      await make(ctx, tx).stakeObligationQuick('OB', 'KEY');
      expect(tx.stakeObligation).not.toHaveBeenCalled();
    });

    it('re-stakes a locked obligation when a prior unstake command exists', async () => {
      const ctx = makeCtx(true);
      const tx = makeTxBlock([unstakeCommand]);
      await make(ctx, tx).stakeObligationQuick('OB', 'KEY');
      expect(tx.stakeObligation).toHaveBeenCalledWith('OB', 'KEY');
    });
  });

  describe('stakeObligationWithVeScaQuick', () => {
    it('binds with the on-chain veSca key when present', async () => {
      const ctx = makeCtx(false, 'BOUND_VK');
      const tx = makeTxBlock();
      await make(ctx, tx).stakeObligationWithVeScaQuick('OB', 'KEY', 'ARG_VK');
      expect(tx.stakeObligationWithVesca).toHaveBeenCalledWith(
        'OB',
        'KEY',
        'BOUND_VK'
      );
    });

    it('falls back to the passed veSca key when none is bound', async () => {
      const ctx = makeCtx(false, undefined);
      const tx = makeTxBlock();
      await make(ctx, tx).stakeObligationWithVeScaQuick('OB', 'KEY', 'ARG_VK');
      expect(tx.stakeObligationWithVesca).toHaveBeenCalledWith(
        'OB',
        'KEY',
        'ARG_VK'
      );
    });

    it('plain-stakes when neither a bound nor passed veSca key exists', async () => {
      const ctx = makeCtx(false, undefined);
      const tx = makeTxBlock();
      await make(ctx, tx).stakeObligationWithVeScaQuick('OB', 'KEY');
      expect(tx.stakeObligationWithVesca).not.toHaveBeenCalled();
      expect(tx.stakeObligation).toHaveBeenCalledWith('OB', 'KEY');
    });
  });

  describe('unstakeObligationQuick', () => {
    it('unstakes only when the obligation is locked', async () => {
      const lockedTx = makeTxBlock();
      await make(makeCtx(true), lockedTx).unstakeObligationQuick('OB', 'KEY');
      expect(lockedTx.unstakeObligation).toHaveBeenCalledWith('OB', 'KEY');

      const unlockedTx = makeTxBlock();
      await make(makeCtx(false), unlockedTx).unstakeObligationQuick(
        'OB',
        'KEY'
      );
      expect(unlockedTx.unstakeObligation).not.toHaveBeenCalled();
    });
  });

  describe('claimBorrowIncentiveQuick', () => {
    it('claims the reward for the resolved obligation', async () => {
      const ctx = makeCtx(false);
      const tx = makeTxBlock();
      const out = await make(ctx, tx).claimBorrowIncentiveQuick(
        'sui',
        'OB',
        'KEY'
      );
      expect(tx.claimBorrowIncentive).toHaveBeenCalledWith('OB', 'KEY', 'sui');
      expect(out).toBe('reward');
    });
  });
});
