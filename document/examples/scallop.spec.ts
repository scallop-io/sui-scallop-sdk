/**
 * Verification examples for document/scallop.md
 *
 * Run with:
 *   pnpm vitest run document/examples/scallop.spec.ts
 */
import { describe, it, expect } from 'vitest';
import { Scallop } from '../../src/index.js';
import {
  ADDRESS_INTERFACE,
  POOL_ADDRESSES,
  WHITELIST,
} from '../../test/mocks.js';

// Use forceAddressesInterface to skip the Scallop API call,
// and walletAddress to skip needing a secret key.
const sdk = new Scallop({
  networkType: 'mainnet',
  walletAddress:
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  forceAddressesInterface: ADDRESS_INTERFACE,
  forcePoolAddressInterface: POOL_ADDRESSES,
  forceWhitelistInterface: WHITELIST,
});

describe('scallop.md — Scallop entry class', () => {
  it('can call init() without errors', async () => {
    await sdk.init();
    console.log('✓ sdk.init() succeeded');
  });

  it('createScallopClient() returns a ScallopClient with correct walletAddress', async () => {
    const client = await sdk.createScallopClient();
    console.log('client.walletAddress:', client.walletAddress);
    console.log('client.networkType:', client.networkType);
    expect(client).toBeTruthy();
    expect(client.walletAddress).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    );
  });

  it('createScallopBuilder() returns a ScallopBuilder', async () => {
    const builder = await sdk.createScallopBuilder();
    console.log('builder.usePythPullModel:', builder.usePythPullModel);
    console.log(
      'builder.useOnChainXOracleList:',
      builder.useOnChainXOracleList
    );
    expect(builder).toBeTruthy();
  });

  it('createScallopQuery() returns a ScallopQuery', async () => {
    const query = await sdk.createScallopQuery();
    expect(query).toBeTruthy();
    console.log('✓ createScallopQuery() returned ScallopQuery instance');
  });

  it('createScallopUtils() returns a ScallopUtils', async () => {
    const utils = await sdk.createScallopUtils();
    expect(utils).toBeTruthy();
    console.log('✓ createScallopUtils() returned ScallopUtils instance');
  });

  it('createScallopIndexer() returns a ScallopIndexer', async () => {
    const indexer = await sdk.createScallopIndexer();
    expect(indexer).toBeTruthy();
    console.log('✓ createScallopIndexer() returned ScallopIndexer instance');
  });

  it('getScallopConstants() returns constants with protocolObjectId', async () => {
    const constants = await sdk.getScallopConstants();
    console.log('constants.protocolObjectId:', constants.protocolObjectId);
    expect(constants).toBeTruthy();
    expect(constants.protocolObjectId).toBeTruthy();
  });

  it('sdk.client hierarchy is accessible after init()', async () => {
    await sdk.init();
    const { client } = sdk;
    console.log('sdk.client.walletAddress:', client.walletAddress);
    console.log('sdk.client.builder:', !!client.builder);
    console.log('sdk.client.query:', !!client.query);
    console.log('sdk.client.utils:', !!client.utils);
    console.log('sdk.client.constants:', !!client.constants);
    console.log('sdk.client.query.indexer:', !!client.query.indexer);
    expect(client.builder).toBeTruthy();
    expect(client.query).toBeTruthy();
    expect(client.utils).toBeTruthy();
    expect(client.constants).toBeTruthy();
    expect(client.query.indexer).toBeTruthy();
  });
});
