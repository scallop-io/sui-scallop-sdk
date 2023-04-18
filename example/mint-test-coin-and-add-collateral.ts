import * as dotenv from 'dotenv';
import { ScallopSui } from '../src';
import { packageId, marketId, coinDecimalsRegistryId, adminCapId, ethTreasuryId, obligationId, priceFeedsId } from './object-ids';
import { SHINAMI_DEVNET_FULLNODE } from './shinami-fullnodes'
dotenv.config();

(async () => {
  const scallopSui = new ScallopSui({
    packageId,
    marketId,
    coinDecimalsRegistryId,
    adminCapId,
    priceFeedsId,
    suiConfig: {
      mnemonics: process.env.MNEMONICS,
      fullnodeUrl: SHINAMI_DEVNET_FULLNODE
    }
  });
  const coinType = `${packageId}::eth::ETH`;
  const txBuilder = scallopSui.createTxBuilder();
  const testCoin = txBuilder.mintTestCoin(ethTreasuryId, 'eth');
  txBuilder.addCollateral(obligationId, testCoin, coinType);
  txBuilder.suiTxBlock.txBlock.setGasBudget(2 * 10**6);
  const res = await scallopSui.submitTxn(txBuilder);
  console.log(res)
})();
