import { describe, expect, it } from 'vitest';
import { normalizeStructTag } from '@mysten/sui/utils';
import {
  getLockKeyFromObligationObject,
  getObligationFromObligationKey,
  mapObligationEventToObligationData,
} from 'src/repositories/obligation/utils.js';
import { ScallopParseError } from 'src/errors/index.js';
import type { ObligationQueryInterface } from 'src/repositories/obligation/types.js';

// parseObjectAs returns the unwrapped `json` for non-dynamic-field objects, so a
// minimal { objectId, type, json } stands in for a real SuiObjectData here.
const obj = (json: unknown, objectId = '0xobj') =>
  ({ objectId, type: '0xpkg::obligation::Thing', json }) as never;

describe('obligation repo utils', () => {
  describe('getObligationFromObligationKey', () => {
    it('extracts the bound obligation id from ownership.of', () => {
      // intent: the key→obligation binding is what every obligation read keys off of
      expect(
        getObligationFromObligationKey(obj({ ownership: { of: '0xOBLIG' } }))
      ).toBe('0xOBLIG');
    });

    it('throws ScallopParseError with the offending objectId when ownership is absent', () => {
      // intent: a malformed key must surface a typed parse error naming the object, not a silent undefined
      try {
        getObligationFromObligationKey(obj({ ownership: {} }, '0xBAD'));
        throw new Error('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(ScallopParseError);
        expect((e as ScallopParseError).context).toEqual({ objectId: '0xBAD' });
      }
    });
  });

  describe('getLockKeyFromObligationObject', () => {
    it('reports a locked obligation as true when lock_key is present', () => {
      // intent: lock status gates borrow-incentive flows; a present key means locked
      expect(getLockKeyFromObligationObject(obj({ lock_key: '0xLOCK' }))).toBe(
        true
      );
    });

    it('throws ScallopParseError when lock_key is missing entirely', () => {
      // intent: distinguish "unlocked" from "couldn't parse" — the latter is an error, not `false`
      expect(() => getLockKeyFromObligationObject(obj({}))).toThrow(
        ScallopParseError
      );
    });
  });

  describe('mapObligationEventToObligationData', () => {
    it('returns undefined for undefined input (no throw on empty reads)', () => {
      expect(mapObligationEventToObligationData(undefined)).toBeUndefined();
    });

    it('flattens nested Move `{ type: { name } }` into a normalized type string', () => {
      // intent: gRPC vs JSON-RPC encode the move type differently; downstream expects a flat string
      const raw = {
        collaterals: [{ type: { name: '0x2::sui::SUI' }, amount: '1' }],
        debts: [{ type: { name: '0x2::usdc::USDC' }, amount: '2' }],
      } as unknown as ObligationQueryInterface;
      const mapped = mapObligationEventToObligationData(raw);
      expect(mapped?.collaterals[0].type).toBe(
        normalizeStructTag('0x2::sui::SUI')
      );
      expect(mapped?.debts[0].type).toBe(normalizeStructTag('0x2::usdc::USDC'));
    });
  });
});
