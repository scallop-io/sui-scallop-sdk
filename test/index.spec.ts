import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from '../src';

dotenv.config();

const NETWORK: NetworkType = 'testnet';

describe('Scallop interact with contract', () => {
  const scallopSDK = new Scallop({
    suiConfig: {
      secretKey: process.env.SECRE_KEY,
      networkType: NETWORK,
    },
  });

  it('Initialize test', async () => {
    expect(!!scallopSDK).toBe(true);
  });
});
