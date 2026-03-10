/**
 * E2E test script for obligation naming query functions.
 * Usage: npx tsx test/obligationNamingQuery.e2e.spec.ts
 *
 * Requires SECRET_KEY in .env
 * Assumes the obligation key already has a name set from the previous e2e test.
 */
import * as dotenv from 'dotenv';
import { Scallop } from 'src/index.js';
import { computeNamingKey } from 'src/queries/obligationNamingQuery.js';

dotenv.config();

const OBLIGATION_KEY_ID =
  '0x809bdbdeca55c88cdc0d6e54120c2f575479329edb6315994a56f2819769e0ae';

const ADDRESS_INTERFACE_PATCH = {
  obligationNaming: {
    id: '0xf03b52be1ab9545203c3aa3c88eecefb020c5c37e59f0cb452d0006689584b27',
    namingRegistry:
      '0x9a98ed110db1982f18cdbb21ee6f724377c8163de1147ca1bf777477af058776',
  },
};

async function main() {
  const sdk = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: 'mainnet',
  });

  const query = await sdk.createScallopQuery();
  const sender = query.walletAddress;

  function patchAddress(address: any) {
    const current = address.getAddresses();
    if (current && !current.obligationNaming) {
      Object.assign(current, ADDRESS_INTERFACE_PATCH);
    }
  }
  patchAddress(query.address);

  console.log('=== Obligation Naming Query E2E ===');
  console.log('Sender:', sender);
  console.log();

  // ── 1. computeNamingKey ──
  console.log('--- computeNamingKey ---');
  const key = computeNamingKey(OBLIGATION_KEY_ID, sender);
  console.log('Key:', key);
  console.log('Format OK:', /^0x[0-9a-f]{64}$/.test(key) ? 'YES' : 'NO');
  console.log();

  // ── 2. getObligationName — existing key ──
  console.log('--- getObligationName (existing key) ---');
  const name = await query.getObligationName(OBLIGATION_KEY_ID, sender);
  console.log('Name:', name);
  console.log('Has name:', name !== null ? 'YES' : 'NO');
  console.log();

  // ── 3. getObligationName — non-existent key ──
  console.log('--- getObligationName (fake key) ---');
  const fakeName = await query.getObligationName(
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    sender
  );
  console.log('Name:', fakeName);
  console.log('Is null:', fakeName === null ? 'YES' : 'NO');
  console.log();

  // ── 4. getObligationName — wrong owner ──
  console.log('--- getObligationName (wrong owner) ---');
  const wrongOwnerName = await query.getObligationName(
    OBLIGATION_KEY_ID,
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  );
  console.log('Name:', wrongOwnerName);
  console.log('Is null:', wrongOwnerName === null ? 'YES' : 'NO');
  console.log();

  // ── 5. getObligationNames — all names for sender ──
  console.log('--- getObligationNames ---');
  const allNames = await query.getObligationNames(sender);
  console.log('Names:', JSON.stringify(allNames, null, 2));
  console.log('Count:', Object.keys(allNames).length);
  console.log();

  // ── Summary ──
  console.log('=== Summary ===');
  console.log(
    'computeNamingKey format:  ',
    /^0x[0-9a-f]{64}$/.test(key) ? 'PASS' : 'FAIL'
  );
  console.log('getObligationName (exist):', name !== null ? 'PASS' : 'FAIL');
  console.log(
    'getObligationName (fake): ',
    fakeName === null ? 'PASS' : 'FAIL'
  );
  console.log(
    'getObligationName (wrong):',
    wrongOwnerName === null ? 'PASS' : 'FAIL'
  );
  console.log(
    'getObligationNames:       ',
    typeof allNames === 'object' ? 'PASS' : 'FAIL'
  );
}

main().catch(console.error);
