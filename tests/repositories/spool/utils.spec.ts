import { describe, expect, it } from 'vitest';
import { normalizeStructTag } from '@mysten/sui/utils';
import {
  parseOriginSpoolData,
  parseSpoolObjects,
} from 'src/repositories/spool/utils.js';
import { ScallopParseError } from 'src/errors/index.js';
import type { OriginSpoolData } from 'src/repositories/spool/types.js';

describe('spool repo utils', () => {
  describe('parseOriginSpoolData', () => {
    it('normalizes the stake struct tag and coerces numeric strings to numbers', () => {
      // intent: indexer/RPC return amounts as strings; leaving them as strings breaks all later math
      const origin = {
        stakeType: '0x2::market_coin::MarketCoin<0x2::sui::SUI>',
        maxDistributedPoint: '100',
        distributedPoint: '40',
        distributedPointPerPeriod: '5',
        pointDistributionTime: '60',
        maxStake: '1000',
        stakes: '250',
        index: '7',
        createdAt: '1700000000',
        lastUpdate: '1700000600',
      } as unknown as OriginSpoolData;

      const parsed = parseOriginSpoolData(origin);
      expect(parsed.stakeType).toBe(
        normalizeStructTag('0x2::market_coin::MarketCoin<0x2::sui::SUI>')
      );
      expect(parsed.maxPoint).toBe(100);
      expect(parsed.staked).toBe(250);
      expect(parsed.lastUpdate).toBe(1700000600);
      // every numeric field must be a real number, not a leftover string
      expect(typeof parsed.index).toBe('number');
    });
  });

  describe('parseSpoolObjects', () => {
    it('throws ScallopParseError when either spool object is missing', () => {
      // intent: a half-fetched pair must fail typed, not parse a partial object into garbage
      expect(() =>
        parseSpoolObjects({ spool: undefined, spoolReward: undefined })
      ).toThrow(ScallopParseError);
    });

    it('throws ScallopParseError on the default empty argument', () => {
      expect(() => parseSpoolObjects()).toThrow(ScallopParseError);
    });
  });
});
