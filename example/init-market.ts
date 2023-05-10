import * as dotenv from 'dotenv';
import { ScallopSui } from '../src';
import {
  packageId,
  marketId,
  coinDecimalsRegistryId,
  adminCapId,
  usdcTreasuryId,
  priceFeedsId,
  usdcMetaDataId,
  ethMetaDataId,
  priceFeedsCapId,
} from './object-ids';
import { SHINAMI_DEVNET_FULLNODE } from './shinami-fullnodes';
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
      fullnodeUrl: SHINAMI_DEVNET_FULLNODE,
    },
  });
  const txBuilder = scallopSui.createTxBuilder();
  txBuilder.initMarketForTest(
    usdcTreasuryId,
    usdcMetaDataId,
    ethMetaDataId,
    priceFeedsCapId
  );
  txBuilder.suiTxBlock.txBlock.setGasBudget(2 * 10 ** 6);
  const res = await scallopSui.submitTxn(txBuilder);
  console.log(res);
})();
