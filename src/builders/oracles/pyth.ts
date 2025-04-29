import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from '@pythnetwork/pyth-sui-js';
import { ScallopBuilder } from 'src/models';
import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';

export const updatePythPriceFeeds = async (
  builder: ScallopBuilder,
  assetCoinNames: string[],
  txBlock: SuiKitTxBlock
) => {
  const pythClient = new SuiPythClient(
    builder.suiKit.client,
    builder.constants.get('core.oracles.pyth.state'),
    builder.constants.get('core.oracles.pyth.wormholeState')
  );
  const priceIds = assetCoinNames.map((assetCoinName) =>
    builder.constants.get(`core.coins.${assetCoinName}.oracle.pyth.feed`)
  );

  // iterate through the endpoints
  const endpoints = builder.utils.pythEndpoints ?? [
    ...builder.address.getWhitelist('pythEndpoints'),
  ];
  for (const endpoint of endpoints) {
    try {
      const pythConnection = new SuiPriceServiceConnection(endpoint);
      const priceUpdateData =
        await pythConnection.getPriceFeedsUpdateData(priceIds);
      await pythClient.updatePriceFeeds(
        txBlock.txBlock, // convert txBlock to TransactionBlock because pyth sdk not support new @mysten/sui yet
        priceUpdateData,
        priceIds
      );

      break;
    } catch (e) {
      console.warn(
        `Failed to update price feeds with endpoint ${endpoint}: ${e}`
      );
    }
  }
};
