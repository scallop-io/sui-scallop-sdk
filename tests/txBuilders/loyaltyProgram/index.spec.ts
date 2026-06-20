import { describe, expect, it, vi } from 'vitest';
import { generateLoyaltyProgramNormalMethod } from 'src/txBuilders/loyaltyProgram/moveCalls.js';
import { generateLoyaltyProgramQuickMethod } from 'src/txBuilders/loyaltyProgram/quick.js';
import { SCA_COIN_TYPE } from 'src/constants/coinType.js';

/**
 * Unit coverage for the loyalty-program domain — the redeem Move calls and the
 * quick wrappers (veSca-key resolution, sca-coin merge, reward transfer).
 */

const SENDER = '0xSENDER';

const addressGet = (k: string) =>
  k === 'loyaltyProgram.id'
    ? 'LPKG'
    : k === 'veScaLoyaltyProgram.id'
      ? 'VLPKG'
      : k;

describe('loyalty-program normal methods', () => {
  const makeCtx = () => ({
    address: { get: addressGet },
    moveCall: vi.fn((..._args: unknown[]) => 'RESULT'),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any) =>
    generateLoyaltyProgramNormalMethod({
      ctx,
      txBlock: {},
    } as unknown as Parameters<typeof generateLoyaltyProgramNormalMethod>[0]);

  it('claimLoyaltyRevenue targets reward_pool::redeem_reward', () => {
    const ctx = makeCtx();
    const out = make(ctx).claimLoyaltyRevenue('VK');
    const c = ctx.moveCall.mock.calls[0];
    expect(c[1]).toBe('LPKG::reward_pool::redeem_reward');
    expect((c[2] as unknown[])[1]).toBe('VK');
    expect(out).toBe('RESULT');
  });

  it('claimVeScaLoyaltyReward targets ve_sca_reward::redeem_reward', () => {
    const ctx = makeCtx();
    make(ctx).claimVeScaLoyaltyReward('VK');
    expect(ctx.moveCall.mock.calls[0][1]).toBe(
      'VLPKG::ve_sca_reward::redeem_reward'
    );
  });
});

describe('loyalty-program quick methods', () => {
  const makeTxBlock = () => ({
    getData: () => ({ sender: SENDER }),
    claimLoyaltyRevenue: vi.fn(() => 'rewardCoin'),
    claimVeScaLoyaltyReward: vi.fn(() => 'rewardVeScaKey'),
    transferObjects: vi.fn(),
  });

  // The default is a realistic coin type. To exercise the "unknown sca type"
  // branch, pass an empty string — NOT `undefined`, which would re-apply the
  // default and mask the branch.
  const makeCtx = (
    veScas: Array<{ keyId: string }>,
    scaCoinType: string = SCA_COIN_TYPE
  ) => ({
    utils: { mergeSimilarCoins: vi.fn(async () => {}) },
    reads: { getVeScas: vi.fn(async () => veScas) },
    constants: { coinTypes: { sca: scaCoinType } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any, txBlock: any) =>
    generateLoyaltyProgramQuickMethod({
      ctx,
      txBlock,
    } as unknown as Parameters<typeof generateLoyaltyProgramQuickMethod>[0]);

  describe('claimLoyaltyRevenueQuick', () => {
    it('resolves the first veSca key, claims, merges sca coins, and transfers', async () => {
      const ctx = makeCtx([{ keyId: 'VK1' }]);
      const tx = makeTxBlock();
      await make(ctx, tx).claimLoyaltyRevenueQuick();

      expect(ctx.reads.getVeScas).toHaveBeenCalled();
      expect(tx.claimLoyaltyRevenue).toHaveBeenCalledWith('VK1');
      expect(ctx.utils.mergeSimilarCoins).toHaveBeenCalledWith(
        tx,
        'rewardCoin',
        SCA_COIN_TYPE,
        SENDER
      );
      expect(tx.transferObjects).toHaveBeenCalledWith(['rewardCoin'], SENDER);
    });

    it('uses an explicit veSca key without a lookup', async () => {
      const ctx = makeCtx([{ keyId: 'VK1' }]);
      const tx = makeTxBlock();
      await make(ctx, tx).claimLoyaltyRevenueQuick('VKX');

      expect(ctx.reads.getVeScas).not.toHaveBeenCalled();
      expect(tx.claimLoyaltyRevenue).toHaveBeenCalledWith('VKX');
    });

    it('throws when the wallet has no veSca', async () => {
      const ctx = makeCtx([]);
      const tx = makeTxBlock();
      await expect(make(ctx, tx).claimLoyaltyRevenueQuick()).rejects.toThrow(
        /No veScaKey/
      );
    });

    it('throws when the sca coin type is unknown', async () => {
      const ctx = makeCtx([{ keyId: 'VK1' }], '');
      const tx = makeTxBlock();
      await expect(
        make(ctx, tx).claimLoyaltyRevenueQuick('VK1')
      ).rejects.toThrow(/sca not found/);
    });
  });

  describe('claimVeScaLoyaltyRewardQuick', () => {
    it('claims the reward veSca key and transfers it to the sender', async () => {
      const ctx = makeCtx([{ keyId: 'VK1' }]);
      const tx = makeTxBlock();
      await make(ctx, tx).claimVeScaLoyaltyRewardQuick('VK1');

      expect(tx.claimVeScaLoyaltyReward).toHaveBeenCalledWith('VK1');
      expect(tx.transferObjects).toHaveBeenCalledWith(
        ['rewardVeScaKey'],
        SENDER
      );
    });
  });
});
