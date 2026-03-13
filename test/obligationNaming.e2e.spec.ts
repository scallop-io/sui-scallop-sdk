import { describe, it, expect, beforeAll } from 'vitest';
import { ScallopBuilder, ScallopQuery } from 'src';
import { computeNamingKey } from 'src/queries/obligationNamingQuery';
import { scallopSDK } from './scallopSdk';

const ENABLE_LOG = false;

const OBLIGATION_KEY_ID =
  '0x809bdbdeca55c88cdc0d6e54120c2f575479329edb6315994a56f2819769e0ae';

let scallopBuilder: ScallopBuilder;
let scallopQuery: ScallopQuery;
let sender: string;

beforeAll(async () => {
  scallopBuilder = await scallopSDK.createScallopBuilder();
  scallopQuery = await scallopSDK.createScallopQuery();
  sender = scallopBuilder.walletAddress;
  console.info('Sender:', sender);
});

describe('Obligation Naming', () => {
  describe('computeNamingKey', () => {
    it('should return a deterministic hex string', () => {
      const key = computeNamingKey(OBLIGATION_KEY_ID, sender);
      if (ENABLE_LOG) console.info('Computed key:', key);
      expect(key).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('should be deterministic for same inputs', () => {
      const key1 = computeNamingKey(OBLIGATION_KEY_ID, sender);
      const key2 = computeNamingKey(OBLIGATION_KEY_ID, sender);
      expect(key1).toBe(key2);
    });

    it('should differ for different inputs', () => {
      const key1 = computeNamingKey(OBLIGATION_KEY_ID, sender);
      const key2 = computeNamingKey(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        sender
      );
      expect(key1).not.toBe(key2);
    });
  });

  describe('Builder', () => {
    it('"setObligationName" should succeed via dry-run', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);
      tx.setObligationName(OBLIGATION_KEY_ID, 'test-name');

      const result = await scallopBuilder.scallopSuiKit.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info('setObligationName result:', result);
      }
      expect(result.effects?.status.status).toEqual('success');
    });

    it('"removeObligationName" should succeed via dry-run', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);
      tx.removeObligationName(OBLIGATION_KEY_ID);

      const result = await scallopBuilder.scallopSuiKit.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info('removeObligationName result:', result);
      }
      expect(result.effects?.status.status).toEqual('success');
    });

    it('"setObligationNameQuick" should succeed via dry-run', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);
      await tx.setObligationNameQuick(OBLIGATION_KEY_ID, 'test-name-quick');

      const result = await scallopBuilder.scallopSuiKit.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info('setObligationNameQuick result:', result);
      }
      expect(result.effects?.status.status).toEqual('success');
    });

    it('"removeObligationNameQuick" should succeed via dry-run', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);
      await tx.removeObligationNameQuick(OBLIGATION_KEY_ID);

      const result = await scallopBuilder.scallopSuiKit.suiKit.inspectTxn(tx);
      console.log(result);
      if (ENABLE_LOG) {
        console.info('removeObligationNameQuick result:', result);
      }
      expect(result.effects?.status.status).toEqual('success');
    });
  });

  describe('Query', () => {
    it('"getObligationName" should return string or null', async () => {
      const name = await scallopQuery.getObligationName(
        OBLIGATION_KEY_ID,
        sender
      );
      if (ENABLE_LOG) console.info('Obligation name:', name);
      expect(name === null || typeof name === 'string').toBeTruthy();
    });

    it('"getObligationNames" should return a record', async () => {
      const names = await scallopQuery.getObligationNames(sender);
      if (ENABLE_LOG) console.info('All names:', names);
      expect(names).toBeDefined();
      expect(typeof names).toBe('object');
    });
  });
});
