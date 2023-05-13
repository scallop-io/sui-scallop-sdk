import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from '../src';

dotenv.config();

const NETWORK: NetworkType = 'testnet';

describe('Test Scallop interact with contract', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRE_KEY,
    networkType: NETWORK,
  });
  const client = await scallopSDK.createScallopClient();

  it('Should get Scallop instance', async () => {
    expect(!!scallopSDK).toBe(true);
  });

  it('Should get market query data', async () => {
    const marketData = await client.queryMarket();
    console.info('marketData:', marketData);
    expect(!!marketData).toBe(true);
  });

  it.skip('Should open a obligation account', async () => {
    const openObligationResult = await client.openObligation();
    console.info('openObligationResult:', openObligationResult);
    expect(openObligationResult.effects.status.status).toEqual('success');
  });

  it('Should get obligations and its query data', async () => {
    const obligations = await client.getObligations();
    console.info('obligations', obligations);

    for (const { id } of obligations) {
      const obligationData = await client.queryObligation(id);
      console.info('obligationData', obligationData);
      expect(!!obligationData).toBe(true);
    }
  });
});
