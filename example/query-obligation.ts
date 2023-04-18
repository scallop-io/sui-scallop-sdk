import { ScallopSui } from '../src';
import { packageId, marketId, coinDecimalsRegistryId, adminCapId, obligationId, priceFeedsId } from './object-ids';
import { SHINAMI_DEVNET_FULLNODE } from './shinami-fullnodes'

(async () => {
  const scallopSui = new ScallopSui({
    packageId,
    marketId,
    coinDecimalsRegistryId,
    adminCapId,
    priceFeedsId,
    suiConfig: {
      fullnodeUrl: SHINAMI_DEVNET_FULLNODE
    }
  });
  const obligationData = await scallopSui.queryObligation(obligationId);
  console.log(obligationData)
})();
