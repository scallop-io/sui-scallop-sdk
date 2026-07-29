import { describe, expect, it, vi } from 'vitest';
import { generateSpoolQuickMethod } from 'src/txBuilders/spool/quick.js';

/**
 * Unit coverage for the spool *quick* methods: stake-account resolution
 * (provided id vs sender lookup), the market-coin / sCoin staking branches, the
 * unstake → mintSCoin conversion, and per-account reward claiming.
 */

const SENDER = '0xSENDER';

const makeTxBlock = () => ({
  getData: () => ({ sender: SENDER }),
  stake: vi.fn(),
  unstake: vi.fn(() => 'marketCoin'),
  mintSCoin: vi.fn(() => 'sCoin'),
  burnSCoin: vi.fn(() => 'marketFromBurn'),
  mergeCoins: vi.fn(),
  transferObjects: vi.fn(),
  claim: vi.fn(async () => 'reward'),
});

const makeCtx = (accounts: Record<string, unknown[]>) => ({
  reads: { getAllStakeAccounts: vi.fn(async () => accounts) },
  coins: {
    selectMarketCoin: vi.fn(async () => ({
      takeCoin: 'take',
      totalAmount: 1_000_000,
    })),
    selectSCoin: vi.fn(async () => ({
      takeCoin: 'take',
      totalAmount: 0,
    })),
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const make = (ctx: any, txBlock: any) =>
  generateSpoolQuickMethod({ ctx, txBlock } as unknown as Parameters<
    typeof generateSpoolQuickMethod
  >[0]);

describe('spool quick methods', () => {
  describe('stakeQuick', () => {
    it('stakes a passed-in market coin directly to the provided stake account (no lookup)', async () => {
      const ctx = makeCtx({ ssui: [] });
      const tx = makeTxBlock();
      await make(ctx, tx).stakeQuick('MARKETCOIN' as never, 'ssui', 'ACCOUNT');

      expect(ctx.reads.getAllStakeAccounts).not.toHaveBeenCalled();
      expect(tx.stake).toHaveBeenCalledWith('ACCOUNT', 'MARKETCOIN', 'ssui');
    });

    it('looks up the senders stake accounts when none is provided', async () => {
      const ctx = makeCtx({ ssui: [{ id: 'A1' }] });
      const tx = makeTxBlock();
      await make(ctx, tx).stakeQuick('MARKETCOIN' as never, 'ssui');

      expect(ctx.reads.getAllStakeAccounts).toHaveBeenCalledWith(SENDER);
      expect(tx.stake).toHaveBeenCalledWith('A1', 'MARKETCOIN', 'ssui');
    });

    it('throws when the sender has no stake account for the coin', async () => {
      const ctx = makeCtx({ ssui: [] });
      const tx = makeTxBlock();
      await expect(make(ctx, tx).stakeQuick(100, 'ssui')).rejects.toThrow(
        /No stake account id found/
      );
    });

    it('stakes the selected market coin when given a numeric amount', async () => {
      const ctx = makeCtx({ ssui: [{ id: 'A1' }] });
      const tx = makeTxBlock();
      await make(ctx, tx).stakeQuick(1_000_000, 'ssui', 'A1');

      expect(ctx.coins.selectMarketCoin).toHaveBeenCalled();
      expect(tx.stake).toHaveBeenCalledWith('A1', 'take', 'ssui');
    });
  });

  describe('unstakeQuick', () => {
    it('unstakes from a staked account and converts to sCoin by default', async () => {
      const ctx = makeCtx({ ssui: [{ id: 'A1', staked: 500 }] });
      const tx = makeTxBlock();
      const out = await make(ctx, tx).unstakeQuick(200, 'ssui');

      expect(tx.unstake).toHaveBeenCalledWith('A1', 200, 'ssui');
      expect(tx.mintSCoin).toHaveBeenCalledWith('ssui', 'marketCoin');
      // single coin → returned directly, no merge
      expect(tx.mergeCoins).not.toHaveBeenCalled();
      expect(out).toBe('sCoin');
    });

    it('returns the raw market coin when returnSCoin is false', async () => {
      const ctx = makeCtx({ ssui: [{ id: 'A1', staked: 500 }] });
      const tx = makeTxBlock();
      const out = await make(ctx, tx).unstakeQuick(
        200,
        'ssui',
        undefined,
        false
      );

      expect(tx.mintSCoin).not.toHaveBeenCalled();
      expect(out).toBe('marketCoin');
    });

    it('skips accounts with nothing staked', async () => {
      const ctx = makeCtx({ ssui: [{ id: 'A1', staked: 0 }] });
      const tx = makeTxBlock();
      const out = await make(ctx, tx).unstakeQuick(200, 'ssui');

      expect(tx.unstake).not.toHaveBeenCalled();
      expect(out).toBeUndefined();
    });
  });

  describe('claimQuick', () => {
    it('claims rewards for every resolved stake account', async () => {
      const ctx = makeCtx({ ssui: [{ id: 'A1' }, { id: 'A2' }] });
      const tx = makeTxBlock();
      const out = await make(ctx, tx).claimQuick('ssui');

      expect(tx.claim).toHaveBeenCalledTimes(2);
      expect(tx.claim).toHaveBeenNthCalledWith(1, 'A1', 'ssui');
      expect(tx.claim).toHaveBeenNthCalledWith(2, 'A2', 'ssui');
      expect(out).toEqual(['reward', 'reward']);
    });
  });
});
