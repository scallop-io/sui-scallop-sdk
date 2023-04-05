import { ScallopSui } from '../src';
import { packageId, marketId, coinDecimalsRegistryId, adminCapId } from './object-ids';
import { SHINAMI_DEVNET_FULLNODE } from './shinami-fullnodes'

(async () => {
  const scallopSui = new ScallopSui({
    packageId,
    marketId,
    coinDecimalsRegistryId,
    adminCapId,
    suiConfig: {
      fullnodeUrl: SHINAMI_DEVNET_FULLNODE
    }
  });
  const obligationId = '0x8921f3727368bf625a18de30290f65e20d8e12336a1f0c38c4cd4f7f342e005c';
  const obligationData = await scallopSui.queryObligation(obligationId);
  console.log(obligationData)
})();
