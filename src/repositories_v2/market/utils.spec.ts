import { describe, expect, it } from 'vitest';
import {
  calculateMarketCollateralData,
  calculateMarketPoolData,
  filterRecords,
  parseOriginMarketCollateralData,
} from './utils.js';
import { ScallopParseError } from 'src/errors/index.js';
import type {
  OriginMarketCollateralData,
  ParsedMarketCollateralData,
  ParsedMarketPoolData,
} from './types.js';

const fixed = (n: number) => ({ value: String(n * 2 ** 32) });

describe('market repo utils', () => {
  describe('filterRecords', () => {
    const records = {
      sui: { coinName: 'sui' },
      usdc: { coinName: 'usdc' },
    };

    it('returns the full record untouched when no coinNames filter is given', () => {
      // intent: an absent filter must NOT drop or reshape entries
      expect(filterRecords(records)).toBe(records);
    });

    it('projects only the requested coinNames, preserving undefined for misses', () => {
      // intent: caller asking for a coin we lack should see `undefined`, not a silent omission
      expect(filterRecords(records, ['sui', 'missing'])).toEqual({
        sui: { coinName: 'sui' },
        missing: undefined,
      });
    });
  });

  describe('parseOriginMarketCollateralData', () => {
    const origin = {
      type: '0x2::sui::SUI',
      isIsolated: false,
      collateralFactor: fixed(0.7),
      liquidationFactor: fixed(0.8),
      liquidationDiscount: fixed(0.05),
      liquidationPenalty: fixed(0.1),
      liquidationReserveFactor: fixed(0.02),
      maxCollateralAmount: '1000',
      totalCollateralAmount: '250',
    } as unknown as OriginMarketCollateralData;

    it('decodes 2^32 fixed-point rate fields back into plain ratios', () => {
      // intent: on-chain stores rates as fixed-point ints; a wrong divisor silently corrupts every rate
      const parsed = parseOriginMarketCollateralData(origin);
      expect(parsed.collateralFactor).toBeCloseTo(0.7, 10);
      expect(parsed.liquidationFactor).toBeCloseTo(0.8, 10);
      expect(parsed.liquidationPenalty).toBeCloseTo(0.1, 10);
      expect(parsed.coinType).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
      );
    });
  });

  describe('calculateMarketCollateralData', () => {
    const parsed = {
      coinType: '0x2::sui::SUI',
      isIsolated: false,
      maxCollateralAmount: 1_000_000_000,
      totalCollateralAmount: 250_000_000,
    } as unknown as ParsedMarketCollateralData;

    it('shifts raw amounts down by the coin decimal to human units', () => {
      // intent: deposit/max amounts must be scaled by decimals or UI shows numbers 10^9 too large
      const result = calculateMarketCollateralData(
        {
          parseCoinNameFromType: () => 'sui',
          getCoinDecimal: () => 9,
        },
        parsed
      );
      expect(result.depositCoin).toBe(0.25);
      expect(result.maxDepositCoin).toBe(1);
      expect(result.depositAmount).toBe(250_000_000);
    });

    it('throws ScallopParseError (not a bare Error) when the coin decimal is unknown', () => {
      // intent: an unmapped coin is a parse-config failure callers must be able to type-discriminate
      expect(() =>
        calculateMarketCollateralData(
          {
            parseCoinNameFromType: () => 'mystery',
            getCoinDecimal: () => undefined,
          },
          parsed
        )
      ).toThrow(ScallopParseError);
    });
  });

  describe('calculateMarketPoolData', () => {
    it('throws ScallopParseError when the coin decimal is unknown', () => {
      // intent: same typed-error contract on the pool path
      const parsed = {
        coinType: '0x2::sui::SUI',
        borrowRateScale: 1,
      } as unknown as ParsedMarketPoolData;
      expect(() =>
        calculateMarketPoolData(
          {
            parseCoinNameFromType: () => 'mystery',
            getCoinDecimal: () => undefined,
            parseAprToApy: (n: number) => n,
          },
          parsed
        )
      ).toThrow(ScallopParseError);
    });
  });
});
