import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType, SuiTxBlock } from '@scallop-io/sui-kit';
import { Scallop, TEST_ADDRESSES } from '../src';
import { updateOracles } from 'src/builders/oracle';

dotenv.config();

// const TEST_ADDRESSES_ID = '66bc988f312deae5d529ffdb';
const NETWORK: NetworkType = 'mainnet';

describe('Test XOracle V2', async () => {
  const scallopSdk = new Scallop({
    addressId: '67c44a103fe1b8c454eb9699',
    secretKey: process.env.SECRET_KEY as string,
    networkType: NETWORK,
    forceAddressesInterface: {
      mainnet: TEST_ADDRESSES,
    },
  });
  const scallopBuilder = await scallopSdk.createScallopBuilder({
    useOnChainXOracleList: true,
  });

  // console.info('\x1b[32mAddresses Id: \x1b[33m', TEST_ADDRESSES_ID);

  it('Should updates oracles success', async () => {
    const coins = ['sui', 'sca', 'usdc', 'deep', 'fud'] as string[];
    const txb = new SuiTxBlock();

    await updateOracles(scallopBuilder, txb, coins);
    const resp = await scallopBuilder.suiKit
      .client()
      .devInspectTransactionBlock({
        transactionBlock: txb.txBlock,
        sender: scallopBuilder.walletAddress,
      });
    expect(resp.effects?.status?.status).toEqual('success');
  });
});
