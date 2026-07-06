import { describe, expect, it, vi } from 'vitest';
import { generateSCoinNormalMethod } from 'src/txBuilders/sCoin/moveCalls.js';
import { generateSCoinQuickMethod } from 'src/txBuilders/sCoin/quick.js';

/**
 * Unit coverage for the sCoin domain — both the pure mint/burn Move calls and
 * the quick (coin-selecting) wrappers.
 */

const SENDER = '0xSENDER';

describe('sCoin normal methods', () => {
  const makeCtx = () => ({
    address: { get: (k: string) => (k === 'scoin.id' ? 'SPKG' : k) },
    moveCall: vi.fn((..._args: unknown[]) => 'RESULT'),
    utils: {
      parseSCoinType: (n: string) => (n === 'bad' ? undefined : `S<${n}>`),
      parseUnderlyingSCoinType: (n: string) => `U<${n}>`,
      getSCoinTreasury: (n: string) => `TREASURY<${n}>`,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any) =>
    generateSCoinNormalMethod({ ctx, txBlock: {} } as unknown as Parameters<
      typeof generateSCoinNormalMethod
    >[0]);

  it('mintSCoin targets mint_s_coin with the treasury + [sCoin, underlying] types', () => {
    const ctx = makeCtx();
    const out = make(ctx).mintSCoin('ssui', 'MARKETCOIN');

    const c = ctx.moveCall.mock.calls[0];
    expect(c[1]).toBe('SPKG::s_coin_converter::mint_s_coin');
    expect(c[2]).toEqual(['TREASURY<ssui>', 'MARKETCOIN']);
    expect(c[3]).toEqual(['S<ssui>', 'U<ssui>']);
    expect(out).toBe('RESULT');
  });

  it('burnSCoin targets burn_s_coin', () => {
    const ctx = makeCtx();
    make(ctx).burnSCoin('ssui', 'SCOIN');

    const c = ctx.moveCall.mock.calls[0];
    expect(c[1]).toBe('SPKG::s_coin_converter::burn_s_coin');
    expect(c[2]).toEqual(['TREASURY<ssui>', 'SCOIN']);
  });

  it('throws on an unknown market-coin name when minting', () => {
    expect(() => make(makeCtx()).mintSCoin('bad', 'MC')).toThrow(
      /Invalid marketCoinName/
    );
  });

  it('throws on an unknown sCoin name when burning', () => {
    expect(() => make(makeCtx()).burnSCoin('bad', 'SC')).toThrow(
      /Invalid sCoin/
    );
  });
});

describe('sCoin quick methods', () => {
  const makeTxBlock = () => ({
    getData: () => ({ sender: SENDER }),
    transferObjects: vi.fn(),
    mintSCoin: vi.fn(() => 'minted'),
    burnSCoin: vi.fn(() => 'burned'),
  });

  const makeCtx = () => ({
    coins: {
      selectMarketCoin: vi.fn(async () => ({
        leftCoin: 'left',
        takeCoin: 'take',
      })),
      selectSCoin: vi.fn(async () => ({ leftCoin: 'left', takeCoin: 'take' })),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (ctx: any, txBlock: any) =>
    generateSCoinQuickMethod({ ctx, txBlock } as unknown as Parameters<
      typeof generateSCoinQuickMethod
    >[0]);

  it('mintSCoinQuick selects the market coin, transfers leftover, and mints', async () => {
    const ctx = makeCtx();
    const tx = makeTxBlock();
    const out = await make(ctx, tx).mintSCoinQuick('ssui', 100);

    expect(ctx.coins.selectMarketCoin).toHaveBeenCalledWith(
      tx,
      'ssui',
      100,
      SENDER
    );
    expect(tx.transferObjects).toHaveBeenCalledWith(['left'], SENDER);
    expect(tx.mintSCoin).toHaveBeenCalledWith('ssui', 'take');
    expect(out).toBe('minted');
  });

  it('burnSCoinQuick selects the sCoin, transfers leftover, and burns', async () => {
    const ctx = makeCtx();
    const tx = makeTxBlock();
    const out = await make(ctx, tx).burnSCoinQuick('ssui', 100);

    expect(ctx.coins.selectSCoin).toHaveBeenCalledWith(tx, 'ssui', 100, SENDER);
    expect(tx.transferObjects).toHaveBeenCalledWith(['left'], SENDER);
    expect(tx.burnSCoin).toHaveBeenCalledWith('ssui', 'take');
    expect(out).toBe('burned');
  });
});
