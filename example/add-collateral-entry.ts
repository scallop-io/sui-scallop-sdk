import * as dotenv from 'dotenv';
import { ScallopSui } from '../src';
import { packageId, marketId, coinDecimalsRegistryId, adminCapId, ethTreasuryId, obligationId } from './object-ids';
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
  const mintRes = await scallopSui.mintTestCoin(ethTreasuryId, 'eth');
  console.log('mint result', mintRes)

  const addCollateralRes = await scallopSui.addCollateral(obligationId, 10 ** 9, `${packageId}::eth::ETH`);
  console.log('add collateral result', addCollateralRes)
})();
