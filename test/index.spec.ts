import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { ScallopClient, ScallopAddress, ADDRESSES_ID } from '../src';

const ENABLE_LOG = false;

dotenv.config();

// At present, the contract of the testnet is stale and cannot be used normally, please use the mainnet for testing.
const NETWORK: NetworkType = 'mainnet';

/**
 *  Remove `.skip` to proceed with testing according to requirements.
 */
describe('Test Scallop interact with contract', async () => {
  const scallopAddress = new ScallopAddress({
    // id: '649bdadbb946e3b1853f3d4d', // Test the latest contract usage within scallop team
    id: ADDRESSES_ID,
    network: NETWORK,
  });
  await scallopAddress.read();
  const client = new ScallopClient(
    {
      secretKey: process.env.SECRET_KEY,
      networkType: NETWORK,
    },
    scallopAddress
  );
  console.info('\x1b[32mYour wallet: \x1b[33m', client.walletAddress);

  it('Should get market query data', async () => {
    const marketData = await client.queryMarket();
    if (ENABLE_LOG) {
      console.info('marketData:');
      console.dir(marketData, { depth: null, colors: true });
    }
    expect(!!marketData).toBe(true);
  });

  it('Should open a obligation account', async () => {
    const openObligationResult = await client.openObligation();
    if (ENABLE_LOG) console.info('openObligationResult:', openObligationResult);
    expect(openObligationResult.effects?.status.status).toEqual('success');
  });

  it('Should get obligations and its query data', async () => {
    const obligations = await client.getObligations();
    console.info('obligations', obligations);

    for (const { id } of obligations) {
      const obligationData = await client.queryObligation(id);
      if (ENABLE_LOG) {
        console.info('id:', id);
        console.info('obligationData:');
        console.dir(obligationData, { depth: null, colors: true });
      }
      expect(!!obligationData).toBe(true);
    }
  });

  // only for testnet
  it.skip('Should get test coin', async () => {
    const mintTestCoinResult = await client.mintTestCoin('usdc', 10 ** 11);
    if (ENABLE_LOG) console.info('mintTestCoinResult:', mintTestCoinResult);
    expect(mintTestCoinResult.effects?.status.status).toEqual('success');
  });

  it('Should depoist collateral successfully', async () => {
    const obligations = await client.getObligations();
    const depositCollateralResult = await client.depositCollateral(
      'sui',
      2 * 10 ** 9,
      true,
      obligations[0]?.id
    );
    if (ENABLE_LOG)
      console.info('depositCollateralResult:', depositCollateralResult);
    expect(depositCollateralResult.effects?.status.status).toEqual('success');
  });

  it('Should withdraw collateral successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const withdrawCollateralResult = await client.withdrawCollateral(
      'sui',
      1 * 10 ** 9,
      true,
      obligations[0].id,
      obligations[0].keyId
    );
    if (ENABLE_LOG)
      console.info('withdrawCollateralResult:', withdrawCollateralResult);
    expect(withdrawCollateralResult.effects?.status.status).toEqual('success');
  });

  it('Should depoist asset successfully', async () => {
    const depositResult = await client.deposit('sui', 2 * 10 ** 9);
    console.info('depositResult:', depositResult);
    expect(depositResult.effects?.status.status).toEqual('success');
  });

  it('Should withdraw asset successfully', async () => {
    const withdrawResult = await client.withdraw('sui', 1 * 10 ** 9);
    if (ENABLE_LOG) console.info('withdrawResult:', withdrawResult);
    expect(withdrawResult.effects?.status.status).toEqual('success');
  });

  it('Should borrow asset successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const borrowResult = await client.borrow(
      'sui',
      3 * 10 ** 8,
      true,
      obligations[0].id,
      obligations[0].keyId
    );
    if (ENABLE_LOG) console.info('borrowResult:', borrowResult);
    expect(borrowResult.effects?.status.status).toEqual('success');
  });

  it('Should repay asset successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const repayResult = await client.repay(
      'sui',
      3 * 10 ** 8,
      true,
      obligations[0].id
    );
    if (ENABLE_LOG) console.info('repayResult:', repayResult);
    expect(repayResult.effects?.status.status).toEqual('success');
  });

  it('Should flash loan successfully', async () => {
    const flashLoanResult = await client.flashLoan(
      'sui',
      10 ** 9,
      (txBlock, coin) => {
        return coin;
      }
    );
    if (ENABLE_LOG) console.info('flashLoanResult:', flashLoanResult);
    expect(flashLoanResult.effects?.status.status).toEqual('success');
  });
});
