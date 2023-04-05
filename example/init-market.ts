import * as dotenv from 'dotenv';
import { ScallopSui } from '../src';
import { packageId, marketId, coinDecimalsRegistryId, adminCapId, usdcTreasuryId } from './object-ids';
import { SHINAMI_DEVNET_FULLNODE } from './shinami-fullnodes'
dotenv.config();

(async () => {
  const scallopSui = new ScallopSui({
    packageId,
    marketId,
    coinDecimalsRegistryId,
    adminCapId,
    suiConfig: {
      mnemonics: process.env.MNEMONICS,
      fullnodeUrl: SHINAMI_DEVNET_FULLNODE
    }
  });
  const txBuilder = scallopSui.createTxBuilder();
  txBuilder.initMarketForTest(usdcTreasuryId);
  txBuilder.suiTxBlock.txBlock.setGasBudget(2 * 10**6);
  const res = await scallopSui.submitTxn(txBuilder);
  console.log(res);
})();
