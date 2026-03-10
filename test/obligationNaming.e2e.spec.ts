/**
 * E2E test script for obligation naming.
 * Usage: npx tsx test/obligationNaming.e2e.spec.ts
 *
 * Requires SECRET_KEY in .env
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

  const builder = await sdk.createScallopBuilder();
  const query = await sdk.createScallopQuery();
  const sender = builder.walletAddress;

  // Patch obligationNaming addresses if not yet in API response
  function patchAddress(address: any) {
    const current = address.getAddresses();
    if (current && !current.obligationNaming) {
      Object.assign(current, ADDRESS_INTERFACE_PATCH);
    }
  }
  patchAddress(builder.address);
  patchAddress(query.address);

  console.log('=== Obligation Naming E2E ===');
  console.log('Sender:', sender);
  console.log('ObligationKey ID:', OBLIGATION_KEY_ID);
  console.log();

  // ── Step 1: Verify computeNamingKey ──
  const computedKey = computeNamingKey(OBLIGATION_KEY_ID, sender);
  console.log('--- computeNamingKey ---');
  console.log('Computed key:', computedKey);
  console.log();

  // ── Step 2: Query name before set ──
  console.log('--- Query name (before set) ---');
  const nameBefore = await query.getObligationName(OBLIGATION_KEY_ID, sender);
  console.log('Name:', nameBefore);
  console.log();

  // ── Step 3: Set name ──
  const testName = `test-${Date.now()}`;
  console.log(`--- Set name: "${testName}" ---`);
  {
    const tx = builder.createTxBlock();
    tx.setSender(sender);
    tx.setObligationName(OBLIGATION_KEY_ID, testName);

    const result = await builder.scallopSuiKit.signAndSendTxn(tx);
    const txResult = result.Transaction ?? result.FailedTransaction;
    console.log('Digest:', txResult?.digest ?? 'unknown');
    console.log(
      'Status:',
      txResult?.effects?.status?.success ? 'success' : 'failed'
    );
    if (!txResult?.effects?.status?.success) {
      console.log('Error:', txResult?.effects?.status?.error);
    }
  }
  console.log();

  // Wait for chain to propagate
  await new Promise((r) => setTimeout(r, 3000));

  // ── Step 4: Query name after set ──
  console.log('--- Query name (after set) ---');
  const nameAfterSet = await query.getObligationName(OBLIGATION_KEY_ID, sender);
  console.log('Name:', nameAfterSet);
  console.log('Match:', nameAfterSet === testName ? 'YES' : 'NO');
  console.log();

  // ── Step 5: Query all obligation names ──
  console.log('--- Query all obligation names ---');
  const allNames = await query.getObligationNames(sender);
  console.log('Names:', JSON.stringify(allNames, null, 2));
  console.log();

  // // ── Step 6: Remove name ──
  // console.log('--- Remove name ---');
  // {
  //   const tx = builder.createTxBlock();
  //   tx.setSender(sender);
  //   tx.removeObligationName(OBLIGATION_KEY_ID);

  //   const result = await builder.scallopSuiKit.signAndSendTxn(tx);
  //   const txResult = result.Transaction ?? result.FailedTransaction;
  //   console.log('Digest:', txResult?.digest ?? 'unknown');
  //   console.log('Status:', txResult?.effects?.status?.success ? 'success' : 'failed');
  //   if (!txResult?.effects?.status?.success) {
  //     console.log('Error:', txResult?.effects?.status?.error);
  //   }
  // }
  // console.log();

  // await new Promise((r) => setTimeout(r, 3000));

  // // ── Step 7: Query name after remove ──
  // console.log('--- Query name (after remove) ---');
  // const nameAfterRemove = await query.getObligationName(
  //   OBLIGATION_KEY_ID,
  //   sender
  // );
  // console.log('Name:', nameAfterRemove);
  // console.log('Removed:', nameAfterRemove === null ? 'YES' : 'NO');
  // console.log();

  // // ── Summary ──
  // console.log('=== Summary ===');
  // console.log('Set name:     ', nameAfterSet === testName ? 'PASS' : 'FAIL');
  // console.log('Remove name:  ', nameAfterRemove === null ? 'PASS' : 'FAIL');
}

main().catch(console.error);
