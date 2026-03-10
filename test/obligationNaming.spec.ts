import { describe, it, expect, beforeAll } from 'vitest';
import { scallopSDK } from './scallopSdk.js';
import { ScallopBuilder, ScallopQuery, Obligation } from 'src/index.js';
import { computeNamingKey } from 'src/queries/obligationNamingQuery.js';

const ENABLE_LOG = false;
let scallopBuilder: ScallopBuilder;
let scallopQuery: ScallopQuery;
let sender: string;
let obligations: Obligation[] = [];

describe('computeNamingKey', () => {
  it('should return a 0x-prefixed 64-char hex string', () => {
    const key = computeNamingKey(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000000000000000000000000000002'
    );
    expect(key).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('should produce deterministic output', () => {
    const obligationKeyId =
      '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1';
    const owner =
      '0xdef456def456def456def456def456def456def456def456def456def456def4';

    const key1 = computeNamingKey(obligationKeyId, owner);
    const key2 = computeNamingKey(obligationKeyId, owner);
    expect(key1).toBe(key2);
  });

  it('should produce different output for different inputs', () => {
    const addr1 =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    const addr2 =
      '0x0000000000000000000000000000000000000000000000000000000000000002';

    const key1 = computeNamingKey(addr1, addr2);
    const key2 = computeNamingKey(addr2, addr1);
    expect(key1).not.toBe(key2);
  });

  it('should be different when only owner changes', () => {
    const obligationKeyId =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    const owner1 =
      '0x0000000000000000000000000000000000000000000000000000000000000002';
    const owner2 =
      '0x0000000000000000000000000000000000000000000000000000000000000003';

    const key1 = computeNamingKey(obligationKeyId, owner1);
    const key2 = computeNamingKey(obligationKeyId, owner2);
    expect(key1).not.toBe(key2);
  });
});

describe('Obligation Naming Builder', () => {
  beforeAll(async () => {
    scallopBuilder = await scallopSDK.createScallopBuilder();
    scallopQuery = await scallopSDK.createScallopQuery();
    sender = scallopBuilder.walletAddress;
    obligations = await scallopQuery.getObligations();
    if (ENABLE_LOG) {
      console.log(`Wallet: ${sender}`);
      console.log(`Obligations: ${obligations.length}`);
    }
  });

  it('"setObligationName" should build a valid transaction', () => {
    if (obligations.length === 0) {
      console.warn('No obligations found, skipping test');
      return;
    }

    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const obligationKeyId = obligations[0].keyId;
    tx.setObligationName(obligationKeyId, 'My Obligation');

    const txData = tx.getData();
    expect(txData.commands.length).toBeGreaterThan(0);
  });

  it('"removeObligationName" should build a valid transaction', () => {
    if (obligations.length === 0) {
      console.warn('No obligations found, skipping test');
      return;
    }

    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const obligationKeyId = obligations[0].keyId;
    tx.removeObligationName(obligationKeyId);

    const txData = tx.getData();
    expect(txData.commands.length).toBeGreaterThan(0);
  });

  it('"setObligationName" should produce a MoveCall with correct target', () => {
    if (obligations.length === 0) {
      console.warn('No obligations found, skipping test');
      return;
    }

    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const obligationKeyId = obligations[0].keyId;
    tx.setObligationName(obligationKeyId, 'Test Name');

    const txData = tx.getData();
    const moveCallCommand = txData.commands.find(
      (cmd: any) => cmd.$kind === 'MoveCall' || cmd.MoveCall
    );
    expect(moveCallCommand).toBeTruthy();

    const moveCall =
      (moveCallCommand as any)?.MoveCall ?? (moveCallCommand as any);
    if (moveCall?.target) {
      expect(moveCall.target).toContain('obligation_naming::set_name');
    }
  });
});

describe('Obligation Naming Query', () => {
  beforeAll(async () => {
    if (!scallopQuery) {
      scallopQuery = await scallopSDK.createScallopQuery();
      sender = scallopQuery.walletAddress;
    }
  });

  it('should return null for non-existent obligation name', async () => {
    const fakeKeyId =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    const name = await scallopQuery.getObligationName(fakeKeyId, sender);
    expect(name).toBeNull();
  });

  it('should return a record from getObligationNames', async () => {
    const names = await scallopQuery.getObligationNames(sender);
    expect(names).toBeDefined();
    expect(typeof names).toBe('object');

    if (ENABLE_LOG) {
      console.info('Obligation names:', names);
    }
  });
});
