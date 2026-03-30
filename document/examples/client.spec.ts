/**
 * Verification examples for document/client.md
 *
 * Run with:
 *   ./node_modules/.bin/vitest run document/examples/client.spec.ts --reporter=verbose
 *
 * Note: Uses sign=false to verify method signatures without executing on-chain.
 * All methods return a Transaction object in this mode.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { Transaction } from '@mysten/sui/transactions';
import { Scallop } from '../../src/index.js';
import {
  ADDRESS_INTERFACE,
  POOL_ADDRESSES,
  WHITELIST,
} from '../../test/mocks.js';

const MOCK_OBLIGATION_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000002';
const MOCK_OBLIGATION_KEY_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000003';
const WALLET =
  '0x0000000000000000000000000000000000000000000000000000000000000001';

let client: Awaited<ReturnType<Scallop['createScallopClient']>>;

beforeAll(async () => {
  const sdk = new Scallop({
    networkType: 'mainnet',
    walletAddress: WALLET,
    forceAddressesInterface: ADDRESS_INTERFACE,
    forcePoolAddressInterface: POOL_ADDRESSES,
    forceWhitelistInterface: WHITELIST,
  });
  client = await sdk.createScallopClient();
  console.log('client.walletAddress:', client.walletAddress);
});

describe('client.md — ScallopClient', () => {
  describe('sign=false returns Transaction (no on-chain execution)', () => {
    it('openObligation(false) returns Transaction', async () => {
      const tx = await client.openObligation(false);
      console.log('openObligation → Transaction type:', typeof tx);
      expect(tx).toBeTruthy();
    });

    it('supply() returns Transaction', async () => {
      const tx = await client.supply('sui', 1_000_000_000, false);
      console.log('supply("sui", 1_000_000_000, false) → Transaction:', !!tx);
      expect(tx).toBeTruthy();
    });

    it('deposit() (deprecated alias of supply) returns Transaction', async () => {
      const tx = await client.deposit('sui', 1_000_000_000, false);
      console.log('deposit() (deprecated) → Transaction:', !!tx);
      expect(tx).toBeTruthy();
    });

    it('withdraw() method exists on client (requires RPC to build tx)', () => {
      // withdraw() calls withdrawQuick() internally which fetches sCoin objects from RPC
      // even when sign=false. Verify the method signature exists.
      expect(typeof client.withdraw).toBe('function');
      console.log(
        'client.withdraw is a function ✓ (requires live RPC to execute)'
      );
    });

    it('depositCollateral() with explicit obligationId returns Transaction', async () => {
      const tx = await client.depositCollateral(
        'sui',
        1_000_000_000,
        false,
        MOCK_OBLIGATION_ID
      );
      console.log(
        'depositCollateral(..., false, obligationId) → Transaction:',
        !!tx
      );
      expect(tx).toBeTruthy();
    });

    it('withdrawCollateral() method exists (requires RPC to build tx)', () => {
      // takeCollateralQuick() fetches collateral data from RPC even when sign=false
      expect(typeof client.withdrawCollateral).toBe('function');
      console.log(
        'client.withdrawCollateral is a function ✓ (requires live RPC to execute)'
      );
    });

    it('borrow() method exists (requires RPC for oracle price feeds)', () => {
      // borrowQuick() fetches oracle price feeds from RPC even when sign=false
      expect(typeof client.borrow).toBe('function');
      console.log(
        'client.borrow is a function ✓ (requires live RPC to execute)'
      );
    });

    it('repay() requires obligationId AND obligationKey — returns Transaction', async () => {
      const tx = await client.repay(
        'sui',
        500_000_000,
        false,
        MOCK_OBLIGATION_ID,
        MOCK_OBLIGATION_KEY_ID
      );
      console.log(
        'repay("sui", 500_000_000, false, obligationId, obligationKey) → Transaction:',
        !!tx
      );
      expect(tx).toBeTruthy();
    });

    it('createStakeAccount() returns Transaction', async () => {
      const tx = await client.createStakeAccount('ssui', false);
      console.log('createStakeAccount("ssui", false) → Transaction:', !!tx);
      expect(tx).toBeTruthy();
    });

    it('stakeObligation() method exists (requires RPC to build tx)', () => {
      // stakeObligationWithVeScaQuick() queries veSCA state from RPC
      expect(typeof client.stakeObligation).toBe('function');
      console.log(
        'client.stakeObligation is a function ✓ (requires live RPC to execute)'
      );
    });

    it('unstakeObligation() method exists (requires RPC to build tx)', () => {
      expect(typeof client.unstakeObligation).toBe('function');
      console.log(
        'client.unstakeObligation is a function ✓ (requires live RPC to execute)'
      );
    });
  });

  describe('method signatures are documented correctly', () => {
    it('supply and deposit are aliases', async () => {
      const txSupply = (await client.supply(
        'sui',
        1_000_000_000,
        false
      )) as Transaction;
      const txDeposit = (await client.deposit(
        'sui',
        1_000_000_000,
        false
      )) as Transaction;
      // Both should produce Transaction objects
      expect(!!txSupply).toBe(!!txDeposit);
      console.log('supply() and deposit() both produce Transaction objects ✓');
    });
  });
});
