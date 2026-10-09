import { beforeEach, describe, expect, it, vi } from 'vitest';
import ScallopBuilder from 'src/models/scallopBuilder/index.js';
import { ScallopTransactionBuildError } from 'src/errors/index.js';

/**
 * Withdraw can draw from two sources: sCoin or legacy market coin. The
 * zero-balance throw is the signal callers use to fall back between them —
 * `coinWithBalance` alone never throws at selection, only at execution. Also
 * pins clamping to the owned balance and the `getBalance` unwrapping
 * (`{ balance: { balance } }`) whose mis-cast to number produced `NaN`.
 */

vi.mock('@mysten/sui/transactions', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  // Return the requested intent args so tests can assert what was asked for.
  coinWithBalance: vi.fn((args: { type?: string; balance: number }) => ({
    intent: args,
  })),
}));

const SENDER = '0xSENDER';
const S_COIN_TYPE = '0x1::scallop_sui::SCALLOP_SUI';
const MARKET_COIN_TYPE = '0x1::reserve::MarketCoin<0x2::sui::SUI>';

const makeBuilder = (balances: Record<string, string>) => {
  const getBalance = vi.fn(
    async ({ coinType }: { owner: string; coinType: string }) => ({
      // Mirrors the Core client shape: balance is an object, not a number.
      balance: { coinType, balance: balances[coinType] ?? '0' },
    })
  );
  const builder = Object.create(ScallopBuilder.prototype) as ScallopBuilder;
  // Bypass the constructor (SuiKit + ScallopQuery need network); only `utils`
  // is read by the coin-selection methods.
  Object.defineProperty(builder, 'utils', {
    value: {
      parseSCoinType: () => S_COIN_TYPE,
      parseMarketCoinType: () => MARKET_COIN_TYPE,
      client: { getBalance },
    },
  });
  return { builder, getBalance };
};

const txBlock = () =>
  ({
    mergeCoins: vi.fn(() => 'merged'),
  }) as never;

describe('ScallopBuilder coin selection', () => {
  beforeEach(() => vi.clearAllMocks());

  describe.each([
    {
      name: 'selectSCoin',
      coinType: S_COIN_TYPE,
      error: /No sCoin balance for ssui/,
    },
    {
      name: 'selectMarketCoin',
      coinType: MARKET_COIN_TYPE,
      error: /No market coin balance for ssui/,
    },
  ] as const)('$name', ({ name, coinType, error }) => {
    const select = (builder: ScallopBuilder, amount: number) =>
      builder[name](txBlock(), 'ssui', amount, SENDER);

    it('returns the owned balance as a number, not NaN from the response object', async () => {
      const { builder, getBalance } = makeBuilder({ [coinType]: '500' });
      const { totalAmount } = await select(builder, 100);

      expect(getBalance).toHaveBeenCalledWith({ owner: SENDER, coinType });
      expect(totalAmount).toBe(500);
    });

    it('requests exactly `amount` when the balance covers it', async () => {
      const { builder } = makeBuilder({ [coinType]: '500' });
      const { takeCoin } = await select(builder, 100);

      expect(takeCoin).toEqual({ intent: { type: coinType, balance: 100 } });
    });

    it('clamps the request to the owned balance so execution does not fail', async () => {
      const { builder } = makeBuilder({ [coinType]: '40' });
      const { takeCoin } = await select(builder, Number.MAX_SAFE_INTEGER);

      expect(takeCoin).toEqual({ intent: { type: coinType, balance: 40 } });
    });

    it('throws on zero balance so callers can fall back to the other coin source', async () => {
      const { builder } = makeBuilder({});

      await expect(select(builder, 100)).rejects.toThrow(error);
      await expect(select(builder, 100)).rejects.toBeInstanceOf(
        ScallopTransactionBuildError
      );
    });
  });

  describe('selectSCoinOrMarketCoin', () => {
    it('uses only sCoin when it covers the amount', async () => {
      const { builder, getBalance } = makeBuilder({ [S_COIN_TYPE]: '500' });
      const result = await builder.selectSCoinOrMarketCoin(
        txBlock(),
        'ssui',
        100,
        SENDER
      );

      expect(result.sCoin).toEqual({
        intent: { type: S_COIN_TYPE, balance: 100 },
      });
      expect(result.marketCoin).toBeUndefined();
      expect(getBalance).toHaveBeenCalledTimes(1);
    });

    it('tops up with only the remaining amount of market coin when sCoin is short', async () => {
      // With the old NaN cast, `remaining > 0` was false and market coin was
      // never selected; requesting the full amount would over-withdraw.
      const { builder } = makeBuilder({
        [S_COIN_TYPE]: '30',
        [MARKET_COIN_TYPE]: '500',
      });
      const result = await builder.selectSCoinOrMarketCoin(
        txBlock(),
        'ssui',
        100,
        SENDER
      );

      expect(result.sCoin).toEqual({
        intent: { type: S_COIN_TYPE, balance: 30 },
      });
      expect(result.marketCoin).toEqual({
        intent: { type: MARKET_COIN_TYPE, balance: 70 },
      });
    });

    it('falls back to market coin for the full amount when sCoin balance is zero', async () => {
      const { builder } = makeBuilder({ [MARKET_COIN_TYPE]: '500' });
      const result = await builder.selectSCoinOrMarketCoin(
        txBlock(),
        'ssui',
        100,
        SENDER
      );

      expect(result.sCoin).toBeUndefined();
      expect(result.marketCoin).toEqual({
        intent: { type: MARKET_COIN_TYPE, balance: 100 },
      });
    });

    it('throws when neither sCoin nor market coin has a balance', async () => {
      const { builder } = makeBuilder({});

      await expect(
        builder.selectSCoinOrMarketCoin(txBlock(), 'ssui', 100, SENDER)
      ).rejects.toBeInstanceOf(ScallopTransactionBuildError);
    });
  });
});
