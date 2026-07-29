import { describe, expect, it, vi } from 'vitest';
import { generateNormalVeScaMethod } from 'src/txBuilders/vesca/moveCalls.js';
import {
  generateQuickVeScaMethod,
  requireVeSca,
} from 'src/txBuilders/vesca/quick.js';

/**
 * Unit coverage for the veSCA domain — the lock/extend/redeem/split/merge Move
 * calls and the higher-value quick orchestration: the `requireVeSca` resolver,
 * `redeemScaQuick` (expiry guard + transfer flag), `extendLockPeriodQuick`, and
 * the `splitVeScaQuick` subscription-table guard.
 */

const SENDER = '0xSENDER';
const VPKG = 'VPKG';

describe('veSCA normal methods', () => {
  const makeCtx = () => ({
    address: { get: (k: string) => (k === 'vesca.id' ? VPKG : k) },
    moveCall: vi.fn((..._args: unknown[]) => 'RESULT'),
  });
  const makeTxBlock = () => ({
    sharedObjectRef: () => ({ tag: 'clock' }),
    pure: { u64: (v: string) => ({ u64: v }) },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any) =>
    generateNormalVeScaMethod({
      ctx,
      txBlock: makeTxBlock(),
    } as unknown as Parameters<typeof generateNormalVeScaMethod>[0]);

  it('lockSca targets mint_ve_sca_key', () => {
    const ctx = makeCtx();
    const out = make(ctx).lockSca('COIN', 123);
    expect(ctx.moveCall.mock.calls[0][1]).toBe(
      `${VPKG}::ve_sca::mint_ve_sca_key`
    );
    expect(out).toBe('RESULT');
  });

  it('extendLockPeriod targets extend_lock_period', () => {
    const ctx = makeCtx();
    make(ctx).extendLockPeriod('VK', 456);
    expect(ctx.moveCall.mock.calls[0][1]).toBe(
      `${VPKG}::ve_sca::extend_lock_period`
    );
  });

  it('redeemSca targets redeem', () => {
    const ctx = makeCtx();
    make(ctx).redeemSca('VK');
    expect(ctx.moveCall.mock.calls[0][1]).toBe(`${VPKG}::ve_sca::redeem`);
  });

  it('splitVeSca pure-encodes the split amount and targets split', () => {
    const ctx = makeCtx();
    make(ctx).splitVeSca('VK', '100');
    const c = ctx.moveCall.mock.calls[0];
    expect(c[1]).toBe(`${VPKG}::ve_sca::split`);
    expect(c[2]).toContainEqual({ u64: '100' });
  });

  it('mergeVeSca targets merge', () => {
    const ctx = makeCtx();
    make(ctx).mergeVeSca('TARGET', 'SOURCE');
    expect(ctx.moveCall.mock.calls[0][1]).toBe(`${VPKG}::ve_sca::merge`);
  });
});

describe('requireVeSca resolver', () => {
  const txBlock = { getData: () => ({ sender: SENDER }) };

  const makeCtx = (overrides: {
    getVeSca?: unknown;
    getVeScas?: unknown[];
  }) => ({
    address: { get: (k: string) => k },
    utils: { logger: { error: vi.fn() } },
    reads: {
      getVeSca: vi.fn(async () => overrides.getVeSca),
      getVeScas: vi.fn(async () => overrides.getVeScas ?? []),
      isVeScaKeyInSubsTable: vi.fn(async () => false),
    },
  });

  const callRequire = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx: any,
    key?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => requireVeSca(ctx, txBlock as any, key);

  it('returns the veSca for an explicit key', async () => {
    const veSca = { keyId: 'K1', unlockAt: 123 };
    const out = await callRequire(makeCtx({ getVeSca: veSca }), 'VK');
    expect(out).toBe(veSca);
  });

  it('returns undefined when the explicit key has no veSca', async () => {
    const out = await callRequire(makeCtx({ getVeSca: undefined }), 'VK');
    expect(out).toBeUndefined();
  });

  it('falls back to the senders highest-balance veSca when no key is given', async () => {
    const ctx = makeCtx({ getVeScas: [{ keyId: 'A' }, { keyId: 'B' }] });
    const out = await callRequire(ctx);
    expect(ctx.reads.getVeScas).toHaveBeenCalledWith({ walletAddress: SENDER });
    expect(out).toEqual({ keyId: 'A' });
  });
});

describe('veSCA quick methods', () => {
  const makeTxBlock = (commands: unknown[] = []) => ({
    getData: () => ({ sender: SENDER }),
    txBlock: { getData: () => ({ commands }) },
    redeemSca: vi.fn(() => 'sca'),
    splitVeSca: vi.fn(() => 'newKey'),
    extendLockPeriod: vi.fn(),
    transferObjects: vi.fn(),
  });

  const makeCtx = (over: { getVeSca?: unknown; inSubsTable?: boolean }) => ({
    address: { get: (k: string) => (k === 'borrowIncentive.id' ? 'BIPKG' : k) },
    utils: {
      getUnlockAt: vi.fn(() => 12345),
      logger: { error: vi.fn() },
      selectCoins: vi.fn(async () => ['c']),
    },
    reads: {
      getVeSca: vi.fn(async () => over.getVeSca),
      getVeScas: vi.fn(async () => []),
      isVeScaKeyInSubsTable: vi.fn(async () => over.inSubsTable ?? false),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any, txBlock: any) =>
    generateQuickVeScaMethod({ ctx, txBlock } as unknown as Parameters<
      typeof generateQuickVeScaMethod
    >[0]);

  describe('redeemScaQuick', () => {
    it('redeems and returns the sca coin when transferSca is false', async () => {
      const ctx = makeCtx({ getVeSca: { keyId: 'K1', unlockAt: 9_999_999 } });
      const tx = makeTxBlock();
      const out = await make(ctx, tx).redeemScaQuick({
        veScaKey: 'VK',
        transferSca: false,
      });

      expect(tx.redeemSca).toHaveBeenCalledWith('K1');
      expect(tx.transferObjects).not.toHaveBeenCalled();
      expect(out).toBe('sca');
    });

    it('transfers the sca coin and returns nothing when transferSca is true', async () => {
      const ctx = makeCtx({ getVeSca: { keyId: 'K1', unlockAt: 9_999_999 } });
      const tx = makeTxBlock();
      const out = await make(ctx, tx).redeemScaQuick({
        veScaKey: 'VK',
        transferSca: true,
      });

      expect(tx.transferObjects).toHaveBeenCalledWith(['sca'], SENDER);
      expect(out).toBeUndefined();
    });

    it('throws when there is no veSca to redeem', async () => {
      const ctx = makeCtx({ getVeSca: undefined });
      const tx = makeTxBlock();
      await expect(
        make(ctx, tx).redeemScaQuick({ veScaKey: 'VK' })
      ).rejects.toThrow(/veSca not found/);
    });
  });

  describe('extendLockPeriodQuick', () => {
    it('extends the lock period of the resolved veSca', async () => {
      const ctx = makeCtx({ getVeSca: { keyId: 'K1', unlockAt: 9_999_999 } });
      const tx = makeTxBlock();
      await make(ctx, tx).extendLockPeriodQuick({
        lockPeriodInDays: 30,
        veScaKey: 'VK',
        autoCheck: false,
      });

      expect(tx.extendLockPeriod).toHaveBeenCalledWith('K1', 12345);
    });
  });

  describe('splitVeScaQuick', () => {
    it('splits and returns the new key when not in the subs table', async () => {
      const ctx = makeCtx({ inSubsTable: false });
      const tx = makeTxBlock();
      const out = await make(ctx, tx).splitVeScaQuick({
        splitAmount: '100',
        veScaKey: 'VK',
        transferVeScaKey: false,
      });

      expect(tx.splitVeSca).toHaveBeenCalledWith('VK', '100');
      expect(out).toBe('newKey');
    });

    it('throws when the key is in the subs table with no prior unstake', async () => {
      const ctx = makeCtx({ inSubsTable: true });
      const tx = makeTxBlock();
      await expect(
        make(ctx, tx).splitVeScaQuick({
          splitAmount: '100',
          veScaKey: 'VK',
          transferVeScaKey: false,
        })
      ).rejects.toThrow(/subs table/);
    });
  });
});
