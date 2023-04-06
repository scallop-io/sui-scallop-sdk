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
  const res = await scallopSui.getObligations();
  console.log(JSON.stringify(res, null, 2));
})();
