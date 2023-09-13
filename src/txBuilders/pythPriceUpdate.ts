import { SuiTxBlock, SuiKit } from '@scallop-io/sui-kit';
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from '@pythnetwork/pyth-sui-js';
import { ScallopAddress } from '../models';
import { SupportCoins } from '../types';

const pythConnection = new SuiPriceServiceConnection(
  'https://hermes-beta.pyth.network'
);
export async function pythOraclePriceUpdate(
  tx: SuiTxBlock,
  address: ScallopAddress,
  suiKit: SuiKit,
  coinNames: SupportCoins[]
) {
  const priceIds = coinNames.map((coinName) =>
    address.get(`core.coins.${coinName}.oracle.pyth.feed`)
  );
  const pythStateId = address.get('core.oracles.pyth.state');
  const wormholeStateId = address.get('core.oracles.pyth.wormholeState');
  const pythClient = new SuiPythClient(
    suiKit.provider(),
    pythStateId,
    wormholeStateId
  );
  const priceUpdateData = await pythConnection.getPriceFeedsUpdateData(
    priceIds
  );
  const priceInfoObjectIds = await pythClient.updatePriceFeeds(
    tx.txBlock,
    priceUpdateData,
    priceIds
  );
  return priceInfoObjectIds;
}
