import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from '../src';

dotenv.config();

const NETWORK: NetworkType = 'testnet';

/**
 *  Remove `.skip` to proceed with testing according to requirements.
 */
describe('Test Scallop interact with contract', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRE_KEY,
    networkType: NETWORK,
  });
  const client = await scallopSDK.createScallopClient();

  it.skip('Should get market query data', async () => {
    const marketData = await client.queryMarket();
    console.info('marketData:', marketData);
    expect(!!marketData).toBe(true);
  });

  it.skip('Should open a obligation account', async () => {
    const openObligationResult = await client.openObligation();
    console.info('openObligationResult:', openObligationResult);
    expect(openObligationResult.effects.status.status).toEqual('success');
  });

  it.skip('Should get obligations and its query data', async () => {
    const obligations = await client.getObligations();
    console.info('obligations', obligations);

    for (const { id } of obligations) {
      const obligationData = await client.queryObligation(id);
      console.info('id:', id);
      console.info('obligationData:');
      console.dir(obligationData, { depth: null, colors: true });
      expect(!!obligationData).toBe(true);
    }
  });

  it.skip('Should get test coin', async () => {
    const mintTestCoinResult = await client.mintTestCoin('usdc', 10 ** 11);
    console.info('mintTestCoinResult:', mintTestCoinResult);
    expect(mintTestCoinResult.effects.status.status).toEqual('success');
  });

  it.skip('Should depoist collateral successfully', async () => {
    const obligations = await client.getObligations();
    const depositCollateralResult = await client.depositCollateral(
      'eth',
      10 ** 8,
      true,
      obligations[0]?.id
    );
    console.info('depositCollateralResult:', depositCollateralResult);
    expect(depositCollateralResult.effects.status.status).toEqual('success');
  });

  it.skip('Should withdraw collateral successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const withdrawCollateralResult = await client.withdrawCollateral(
      'eth',
      10 ** 8,
      true,
      obligations[0].id,
      obligations[0].keyId
    );
    console.info('withdrawCollateralResult:', withdrawCollateralResult);
    expect(withdrawCollateralResult.effects.status.status).toEqual('success');
  });

  it.skip('Should depoist asset successfully', async () => {
    const depositResult = await client.deposit('usdc', 10 ** 10, true);
    console.info('depositResult:', depositResult);
    expect(depositResult.effects.status.status).toEqual('success');
  });

  it.skip('Should withdraw asset successfully', async () => {
    const withdrawResult = await client.withdraw('usdc', 5 * 10 ** 8, true);
    console.info('withdrawResult:', withdrawResult);
    expect(withdrawResult.effects.status.status).toEqual('success');
  });

  it.skip('Should borrow asset successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const borrowResult = await client.borrow(
      'usdc',
      10 ** 9,
      true,
      obligations[0].id,
      obligations[0].keyId
    );
    console.info('borrowResult:', borrowResult);
    expect(borrowResult.effects.status.status).toEqual('success');
  });

  it.skip('Should repay asset successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const repayResult = await client.repay(
      'usdc',
      10 ** 8,
      true,
      obligations[0].id
    );
    console.info('repayResult:', repayResult);
    expect(repayResult.effects.status.status).toEqual('success');
  });
});