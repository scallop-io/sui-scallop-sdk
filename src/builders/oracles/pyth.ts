import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from '@pythnetwork/pyth-sui-js';
import { ScallopBuilder } from 'src/models';
import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';

export const updatePythPriceFeeds = async (
  builder: ScallopBuilder,
  assetCoinNames: string[],
  txBlock: SuiKitTxBlock,
  isSponsoredTx: boolean = false
) => {
  const pythClient = new SuiPythClient(
    builder.suiKit.client,
    builder.address.get('core.oracles.pyth.state'),
    builder.address.get('core.oracles.pyth.wormholeState'),
    {
      defaultPackageId:
        '0xa6f9bec2f9748656b6af8aafb5d7bc1a0d5faf25ac9645fc7f447822cd509325',
      gasStationId:
        '0xa8b8dcc9880166edb57b53e05f8df7364d31b5d9b7d107fd27f0b69cf338b687',
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
        txBlock.txBlock,
        priceUpdateData,
        priceIds,
        isSponsoredTx
      );

      break;
    } catch (e) {
      console.warn(
        `Failed to update price feeds with endpoint ${endpoint}: ${e}`
      );
    }
  }
};
