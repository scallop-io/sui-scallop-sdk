import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from '../src';

dotenv.config();

const NETWORK: NetworkType = 'testnet';

describe('Test Scallop interact with contract', () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRE_KEY,
    networkType: NETWORK,
  });

  it('Should get Scallop instance', async () => {
    expect(!!scallopSDK).toBe(true);
  });

  it('Should get market query data', async () => {
    const client = await scallopSDK.createScallopClient();
    const marketData = await client.queryMarket();
    console.log(marketData);
    expect(!!marketData).toBe(true);
  });
});
