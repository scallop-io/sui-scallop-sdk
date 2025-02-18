import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType, SuiTxBlock } from '@scallop-io/sui-kit';
import { Scallop } from 'src/';
import type { SupportAssetCoins } from 'src/';
import { updateOracles } from 'src/builders/oracle';

dotenv.config();

const TEST_ADDRESSES_ID = '66bc988f312deae5d529ffdb';
const NETWORK: NetworkType = 'mainnet';

describe('Test XOracle V2', async () => {
  const scallopSdk = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
    addressesId: TEST_ADDRESSES_ID,
  });
  const scallopBuilder = await scallopSdk.createScallopBuilder();
  const scallopClient = await scallopSdk.createScallopClient();

  console.info('\x1b[32mAddresses Id: \x1b[33m', TEST_ADDRESSES_ID);

  it('Should updates oracles success', async () => {
    const coins = ['weth', 'wusdt', 'wusdc', 'sui'] as SupportAssetCoins[];
    const txb = new SuiTxBlock();

    await updateOracles(scallopBuilder, txb, coins);

    const resp = await scallopClient.suiKit.signAndSendTxn(txb);
    expect(resp.effects?.status?.status).toEqual('success');
  });
});
