import { describe, expect, it, vi } from 'vitest';
import { generateCoreQuickMethod } from 'src/txBuilders/core/quick.js';

/**
 * Unit coverage for the core *quick* (orchestration) methods. These drive the
 * generator with a hand-built `CoreActionContext` + a recording tx-block, so we
 * assert the orchestration — coin selection, leftover transfer, oracle-update
 * coin lists, obligation resolution, sCoin conversion — with no network.
 */

const SENDER = '0xSENDER';

const makeTxBlock = () => ({
  getData: () => ({ sender: SENDER }),
  transferObjects: vi.fn(),
  supply: vi.fn(() => ({ tag: 'marketCoin' })),
  mintSCoin: vi.fn(() => ({ tag: 'sCoin' })),
  withdraw: vi.fn(() => ({ tag: 'withdrawn' })),
  burnSCoin: vi.fn(() => ({ tag: 'marketFromBurn' })),
  mergeCoins: vi.fn(),
  borrow: vi.fn(() => ({ tag: 'borrowed' })),
  borrowWithReferral: vi.fn(() => ({ tag: 'borrowedRef' })),
  repay: vi.fn(() => ({ tag: 'repaid' })),
  takeCollateral: vi.fn(() => ({ tag: 'collateral' })),
  depositCollateral: vi.fn(),
  liquidate: vi.fn(() => [{ tag: 'debt' }, { tag: 'coll' }]),
  object: vi.fn((id: string) => ({ tag: 'object', id })),
});

const makeCtx = () => ({
  reads: {
    getObligations: vi.fn(async () => [{ id: 'O1', keyId: 'K1' }]),
    getObligationCoinNames: vi.fn(async () => ['usdc']),
  },
  coins: {
    selectCoin: vi.fn(async () => ({ takeCoin: 'take' })),
    selectSCoinOrMarketCoin: vi.fn(async () => ({
      sCoin: 'sc',
      marketCoin: undefined as unknown,
    })),
  },
  oracles: { updateOracles: vi.fn(async () => {}) },
  utils: {
    parseMarketCoinName: vi.fn((n: string) => `s${n}`),
    parseSCoinName: vi.fn((n: string) => `s${n}`),
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const make = (ctx: any, txBlock: any) =>
  generateCoreQuickMethod({ ctx, txBlock } as unknown as Parameters<
    typeof generateCoreQuickMethod
  >[0]);

describe('core quick methods', () => {
  describe('supplyQuick', () => {
    it('selects coin, transfers leftover, supplies, and converts to sCoin by default', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      const result = await make(ctx, tx).supplyQuick(1000, 'sui');

      expect(ctx.coins.selectCoin).toHaveBeenCalledWith(
        tx,
        'sui',
        1000,
        SENDER,
        false
      );
      expect(tx.supply).toHaveBeenCalledWith('take', 'sui');
      // returnSCoin defaults to true → mints with the market-coin name
      expect(tx.mintSCoin).toHaveBeenCalledWith('ssui', { tag: 'marketCoin' });
      expect(result).toEqual({ tag: 'sCoin' });
    });

    it('returns the raw market coin when returnSCoin is false', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      const result = await make(ctx, tx).supplyQuick(1000, 'sui', false);

      expect(tx.mintSCoin).not.toHaveBeenCalled();
      expect(result).toEqual({ tag: 'marketCoin' });
    });

    it('skips the leftover transfer when there is no left coin', async () => {
      const ctx = makeCtx();
      ctx.coins.selectCoin.mockResolvedValue({
        takeCoin: 'take',
      } as never);
      const tx = makeTxBlock();
      await make(ctx, tx).supplyQuick(1000, 'sui');

      expect(tx.transferObjects).not.toHaveBeenCalled();
    });
  });

  describe('withdrawQuick', () => {
    it('burns the sCoin then withdraws (no market coin held)', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      const result = await make(ctx, tx).withdrawQuick(500, 'sui');

      expect(tx.burnSCoin).toHaveBeenCalledWith('ssui', 'sc');
      expect(tx.mergeCoins).not.toHaveBeenCalled();
      // the burned market coin is what gets withdrawn
      expect(tx.withdraw).toHaveBeenCalledWith(
        { tag: 'marketFromBurn' },
        'sui'
      );
      expect(result).toEqual({ tag: 'withdrawn' });
    });

    it('merges the burned market coin into an existing market coin', async () => {
      const ctx = makeCtx();
      ctx.coins.selectSCoinOrMarketCoin.mockResolvedValue({
        sCoin: 'sc',
        marketCoin: 'mc',
      } as never);
      const tx = makeTxBlock();
      await make(ctx, tx).withdrawQuick(500, 'sui');

      expect(tx.mergeCoins).toHaveBeenCalledWith('mc', [
        { tag: 'marketFromBurn' },
      ]);
      expect(tx.withdraw).toHaveBeenCalledWith('mc', 'sui');
    });

    it('throws when the coin has no sCoin name', async () => {
      const ctx = makeCtx();
      ctx.utils.parseSCoinName.mockReturnValue(undefined as never);
      const tx = makeTxBlock();
      await expect(make(ctx, tx).withdrawQuick(500, 'sui')).rejects.toThrow(
        /No sCoin/
      );
    });
  });

  describe('borrowQuick', () => {
    it('updates oracles for obligation coins plus the borrowed coin, then borrows', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      await make(ctx, tx).borrowQuick(200, 'sui', 'OBID', 'OBKEY');

      // both obligation id + key provided → used verbatim (no getObligations)
      expect(ctx.reads.getObligations).not.toHaveBeenCalled();
      expect(ctx.reads.getObligationCoinNames).toHaveBeenCalledWith('OBID');
      expect(ctx.oracles.updateOracles).toHaveBeenCalledWith(
        tx,
        ['usdc', 'sui'],
        undefined
      );
      expect(tx.borrow).toHaveBeenCalledWith('OBID', 'OBKEY', 200, 'sui');
    });

    it('falls back to the senders first obligation when id/key are omitted', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      await make(ctx, tx).borrowQuick(200, 'sui');

      expect(ctx.reads.getObligations).toHaveBeenCalledWith(SENDER);
      expect(tx.borrow).toHaveBeenCalledWith('O1', 'K1', 200, 'sui');
    });
  });

  describe('borrowWithReferralQuick', () => {
    it('updates oracles and borrows with the referral object', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      await make(ctx, tx).borrowWithReferralQuick(
        200,
        'sui',
        'REFERRAL',
        'OBID',
        'OBKEY'
      );

      expect(ctx.oracles.updateOracles).toHaveBeenCalledWith(
        tx,
        ['usdc', 'sui'],
        undefined
      );
      expect(tx.borrowWithReferral).toHaveBeenCalledWith(
        'OBID',
        'OBKEY',
        'REFERRAL',
        200,
        'sui'
      );
    });
  });

  describe('repayQuick', () => {
    it('selects the repay coin, transfers leftover, and repays', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      await make(ctx, tx).repayQuick(300, 'sui', 'OBID');

      expect(ctx.coins.selectCoin).toHaveBeenCalledWith(
        tx,
        'sui',
        300,
        SENDER,
        false
      );
      expect(tx.repay).toHaveBeenCalledWith('OBID', 'take', 'sui');
    });
  });

  describe('depositCollateralQuick', () => {
    it('uses the provided obligation id without a query', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      await make(ctx, tx).depositCollateralQuick(1000, 'sui', 'OBID');

      expect(ctx.reads.getObligations).not.toHaveBeenCalled();
      expect(tx.depositCollateral).toHaveBeenCalledWith('OBID', 'take', 'sui');
    });

    it('resolves the obligation from the sender when none is given', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      await make(ctx, tx).depositCollateralQuick(1000, 'sui');

      expect(ctx.reads.getObligations).toHaveBeenCalledWith(SENDER);
      expect(tx.depositCollateral).toHaveBeenCalledWith('O1', 'take', 'sui');
    });
  });

  describe('takeCollateralQuick', () => {
    it('updates oracles for the obligation coins, then takes collateral', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      const result = await make(ctx, tx).takeCollateralQuick(
        50,
        'sui',
        'OBID',
        'OBKEY'
      );

      expect(ctx.reads.getObligationCoinNames).toHaveBeenCalledWith('OBID');
      expect(ctx.oracles.updateOracles).toHaveBeenCalledWith(
        tx,
        ['usdc'],
        undefined
      );
      expect(tx.takeCollateral).toHaveBeenCalledWith(
        'OBID',
        'OBKEY',
        50,
        'sui'
      );
      expect(result).toEqual({ tag: 'collateral' });
    });
  });

  describe('updateAssetPricesQuick', () => {
    it('delegates straight to updateOracles', async () => {
      const ctx = makeCtx();
      const tx = makeTxBlock();
      const opts = { isSponsoredTx: true };
      await make(ctx, tx).updateAssetPricesQuick(['sui', 'usdc'], opts);

      expect(ctx.oracles.updateOracles).toHaveBeenCalledWith(
        tx,
        ['sui', 'usdc'],
        opts
      );
    });
  });

  describe('liquidateQuick', () => {
    it('updates oracles, selects the debt coin, and liquidates a string obligation', async () => {
      const ctx = makeCtx();
      ctx.reads.getObligationCoinNames.mockResolvedValue([
        'sui',
        'usdc',
      ] as never);
      const tx = makeTxBlock();
      await make(ctx, tx).liquidateQuick(100, 'sui', 'usdc', 'OBID');

      expect(ctx.oracles.updateOracles).toHaveBeenCalledWith(
        tx,
        ['sui', 'usdc'],
        undefined
      );
      expect(ctx.coins.selectCoin).toHaveBeenCalledWith(
        tx,
        'sui',
        100,
        SENDER,
        false
      );
      // string obligation id is wrapped via txBlock.object(...)
      expect(tx.object).toHaveBeenCalledWith('OBID');
      expect(tx.liquidate).toHaveBeenCalledWith(
        { tag: 'object', id: 'OBID' },
        'take',
        'sui',
        'usdc'
      );
    });
  });
});
