import { describe, it, expect, beforeAll } from 'vitest';
import { ScallopQuery } from 'src';
import { computeNamingKey } from 'src/queries/obligationNamingQuery';
import { scallopSDK } from './scallopSdk';

const ENABLE_LOG = false;

const OBLIGATION_KEY_ID =
  '0x809bdbdeca55c88cdc0d6e54120c2f575479329edb6315994a56f2819769e0ae';

const FAKE_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000001';

let scallopQuery: ScallopQuery;
let sender: string;

beforeAll(async () => {
  scallopQuery = await scallopSDK.createScallopQuery();
  sender = scallopQuery.walletAddress;
  console.info('Sender:', sender);
});

describe('Obligation Naming Query', () => {
  describe('computeNamingKey', () => {
    it('should return a valid hex string', () => {
      const key = computeNamingKey(OBLIGATION_KEY_ID, sender);
      if (ENABLE_LOG) console.info('Key:', key);
      expect(key).toMatch(/^0x[0-9a-f]{64}$/);
    });
  });

  describe('getObligationName', () => {
    it('should return string or null for existing key', async () => {
      const name = await scallopQuery.getObligationName(
        OBLIGATION_KEY_ID,
        sender
      );
      if (ENABLE_LOG) console.info('Name:', name);
      expect(name === null || typeof name === 'string').toBeTruthy();
    });

    it('should return null for non-existent key', async () => {
      const name = await scallopQuery.getObligationName(FAKE_ADDRESS, sender);
      if (ENABLE_LOG) console.info('Fake key name:', name);
      expect(name).toBeNull();
    });

    it('should return null for wrong owner', async () => {
      const name = await scallopQuery.getObligationName(
        OBLIGATION_KEY_ID,
        FAKE_ADDRESS
      );
      if (ENABLE_LOG) console.info('Wrong owner name:', name);
      expect(name).toBeNull();
    });
  });

  describe('getObligationNames', () => {
    it('should return a record of names', async () => {
      const allNames = await scallopQuery.getObligationNames(sender);
      if (ENABLE_LOG) console.info('All names:', allNames);
      expect(allNames).toBeDefined();
      expect(typeof allNames).toBe('object');
    });
  });
});
