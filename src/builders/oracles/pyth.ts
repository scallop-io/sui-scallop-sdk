import {
  HexString,
  SuiPriceServiceConnection,
  SuiPythClient,
} from '@pythnetwork/pyth-sui-js';
import { ScallopBuilder } from 'src/models';
import {
  SUI_CLOCK_OBJECT_ID,
  type SuiTxBlock as SuiKitTxBlock,
  type Transaction,
} from '@scallop-io/sui-kit';
import { SuiClient } from '@mysten/sui/client';

type ObjectId = string;
class ScallopPythClient extends SuiPythClient {
  constructor(
    provider: SuiClient,
    pythStateId: ObjectId,
    wormholeStateId: ObjectId,
    private params: {
      // addressId?: string;
      defaultPackageId: ObjectId;
      gasStationId: ObjectId;
    }
  ) {
    super(provider, pythStateId, wormholeStateId);
  }

  async updatePriceFeedsWithSponsoredBaseUpdateFee(
    tx: Transaction,
    updates: Buffer[],
    feedIds: HexString[]
  ) {
    if (!this.params) throw new Error('Please provide params');
    const { defaultPackageId: scallopSponsorPackage, gasStationId } =
      this.params;
    const packageId = await this.getPythPackageId();
    let priceUpdatesHotPotato = await this.verifyVaasAndGetHotPotato(
      tx,
      updates,
      packageId
    );

    const priceInfoObjects = [];
    for (const feedId of feedIds) {
      const priceInfoObjectId = await this.getPriceFeedObjectId(feedId);
      if (!priceInfoObjectId) {
        throw new Error(`Price feed object not found for ID: ${feedId}`);
      }
      priceInfoObjects.push(priceInfoObjectId);
    }

    const clockObjectRef = tx.sharedObjectRef({
      objectId: SUI_CLOCK_OBJECT_ID,
      mutable: false,
      initialSharedVersion: '1',
    });

    for (let i = 0; i < priceInfoObjects.length; i++) {
      const priceInfoObjectId = priceInfoObjects[i];
      [priceUpdatesHotPotato] = tx.moveCall({
        target: `${scallopSponsorPackage}::pyth_sponsor::update_single_price_feed_with_sponsor`,
        arguments: [
          tx.object(this.pythStateId),
          priceUpdatesHotPotato,
          tx.object(priceInfoObjectId),
          tx.object(gasStationId),
          clockObjectRef,
        ],
      });
    }

    tx.moveCall({
      target: `${packageId}::hot_potato_vector::destroy`,
      arguments: [priceUpdatesHotPotato],
      typeArguments: [`${packageId}::price_info::PriceInfo`],
    });
  }
}

export const updatePythPriceFeeds = async (
  builder: ScallopBuilder,
  assetCoinNames: string[],
  txBlock: SuiKitTxBlock,
  isSponsoredTx: boolean = false
) => {
  const pythClient = new ScallopPythClient(
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

  const endpoints = builder.utils.pythEndpoints ?? [
    ...builder.constants.whitelist.pythEndpoints,
  ];

  // iterate through the endpoints
  for (const endpoint of endpoints) {
    try {
      const pythConnection = new SuiPriceServiceConnection(endpoint);
      const priceUpdateData =
        await pythConnection.getPriceFeedsUpdateData(priceIds);

      if (isSponsoredTx) {
        // Use gas station to sponsor the baseFeeUpdate
        await pythClient.updatePriceFeedsWithSponsoredBaseUpdateFee(
          txBlock.txBlock,
          priceUpdateData,
          priceIds
        );
      } else {
        await pythClient.updatePriceFeeds(
          txBlock.txBlock,
          priceUpdateData,
          priceIds
        );
      }

      return;
    } catch (e) {
      console.warn(
        `Failed to update price feeds with endpoint ${endpoint}: ${e}`
      );
    }
  }
};
