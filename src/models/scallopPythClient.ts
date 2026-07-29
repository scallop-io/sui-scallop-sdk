import { ClientWithCoreApi } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { HexString, SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import { SuiPythClient } from '@pythnetwork/pyth-sui-js/client';

type ObjectId = string;
/**
 * Pyth client extended with a sponsored base-update-fee path (Scallop gas
 * station pays the per-feed base fee).
 */
export class ScallopPythClient extends SuiPythClient {
  private LEGACY_PYTH_HERMES_ENDPOINT = 'https://hermes.pyth.network';
  private DEFAULT_PYTH_URL = 'https://pyth.dourolabs.app/hermes';

  constructor(
    provider: ClientWithCoreApi,
    pythStateId: ObjectId,
    wormholeStateId: ObjectId,
    private params: {
      defaultPackageId: ObjectId;
      gasStationId: ObjectId;
    } & {
      pythEndpoint?: string;
      pythApiKey?: string;
      indexerUrl?: string;
    }
  ) {
    // pyth-sui-js v4 reads exclusively through the unified `.core` API, so any
    // `@mysten/sui` v2 client can be passed straight through — no cast needed.
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

    for (let i = 0; i < priceInfoObjects.length; i++) {
      const priceInfoObjectId = priceInfoObjects[i];
      [priceUpdatesHotPotato] = tx.moveCall({
        target: `${scallopSponsorPackage}::pyth_sponsor::update_single_price_feed_with_sponsor`,
        arguments: [
          tx.object(this.pythStateId),
          priceUpdatesHotPotato,
          tx.object(priceInfoObjectId),
          tx.object(gasStationId),
          tx.object.clock(),
        ],
      });
    }

    tx.moveCall({
      target: `${packageId}::hot_potato_vector::destroy`,
      arguments: [priceUpdatesHotPotato],
      typeArguments: [`${packageId}::price_info::PriceInfo`],
    });
  }

  async getPriceFeedsUpdateData(priceFeeds: string[]) {
    const { pythEndpoint = this.DEFAULT_PYTH_URL } = this.params;

    if (
      this.params.pythApiKey ||
      pythEndpoint === this.LEGACY_PYTH_HERMES_ENDPOINT
    ) {
      const conn = new SuiPriceServiceConnection(pythEndpoint, {
        accessToken: this.params.pythApiKey,
      });
      return conn.getPriceFeedsUpdateData(priceFeeds);
    } else if (this.params.indexerUrl) {
      // Using Scallop API enpdoint
      const response = await fetch(`${this.params.indexerUrl}/api/price/pyth`);
      const { data } = await response.json();
      return [
        Buffer.from(
          data.data.replace(/^0x/, ''),
          data.encoding as BufferEncoding
        ),
      ];
    }
    throw new Error(
      'No pythApiKey or indexerUrl provided for fetching price feeds update data'
    );
  }
}
