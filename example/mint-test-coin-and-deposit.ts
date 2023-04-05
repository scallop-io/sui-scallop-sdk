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
  const coinType = `${packageId}::usdc::USDC`;
  const txBuilder = scallopSui.createTxBuilder();
  const testCoin = txBuilder.mintTestCoin(usdcTreasuryId, 'usdc');
  txBuilder.depositEntry(testCoin, coinType);
  const res = await scallopSui.submitTxn(txBuilder);
  console.log(res)
})();
