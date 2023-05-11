import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from '../dist';

dotenv.config();

const NETWORK: NetworkType = 'testnet';

describe('Scallop', () => {
  const scallopSDK = new Scallop({
    suiConfig: {
      secretKey: process.env.SECRE_KEY,
      networkType: NETWORK,
    },
  });

  it('Initialize test', async () => {
    console.log(scallopSDK);

    expect(!!scallopSDK).toBe(true);
  });
});
