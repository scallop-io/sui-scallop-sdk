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
    builder.address.get('core.oracles.pyth.state'),
    builder.address.get('core.oracles.pyth.wormholeState'),
    {
      defaultPackageId:
        '0x8ac386d3a3b4d90865b69ed73150680673b66169ba6fb15e841eb7d4720ef642',
      gasStationId:
        '0xecaef0fd26e1e5e12d0e459ca821b3441f91587c3f319100b93258223f508ed6',
    }
  );
  const priceIds = assetCoinNames.map((assetCoinName) =>
    builder.address.get(`core.coins.${assetCoinName}.oracle.pyth.feed`)
  );

  // iterate through the endpoints
  const endpoints = builder.utils.pythEndpoints ?? [
    ...builder.constants.whitelist.pythEndpoints,
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
