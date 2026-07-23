import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from '@pythnetwork/pyth-sui-js';
import type { HexString } from '@pythnetwork/pyth-sui-js';
import type { ClientWithCoreApi } from '@mysten/sui/client';
import type { SuiObjectArg } from '@scallop-io/sui-kit';
import { SUI_CLOCK_OBJECT_ID, type Transaction } from '@scallop-io/sui-kit';
import { PYTH_SPONSOR } from 'src/constants/index.js';
import { IndexerApiResponse } from 'src/repositories/price/schema.js';
import type { SupportOracleType } from 'src/types/index.js';
import {
  BaseOracleRule,
  type PrepareParams,
  type SetPriceParams,
} from './types.js';
import { LEGACY_PYTH_HERMES_ENDPOINT } from 'src/repositories/price/const.js';

type ObjectId = string;

/**
 * Pyth client extended with a sponsored base-update-fee path (Scallop gas
 * station pays the per-feed base fee).
 */
class ScallopPythClient extends SuiPythClient {
  constructor(
    provider: ClientWithCoreApi,
    pythStateId: ObjectId,
    wormholeStateId: ObjectId,
    private params: {
      defaultPackageId: ObjectId;
      gasStationId: ObjectId;
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

/**
 * Pyth oracle rule. Uses the default `set_price_as_<ruleType>` target (state +
 * per-coin feed object + registry) and additionally implements the pull-model
 * pre-tx step: fetch VAAs and push feed updates on-chain before `set_price`.
 */
export class PythOracleRule extends BaseOracleRule {
  readonly type: SupportOracleType = 'pyth';

  protected packageId(): string {
    return this.ctx.address.get('core.packages.pyth.id');
  }

  protected priceArgs({ assetCoinName }: SetPriceParams): SuiObjectArg[] {
    return [
      this.ctx.address.get('core.oracles.pyth.state'),
      this.ctx.address.get(
        `core.coins.${assetCoinName}.oracle.pyth.feedObject`
      ),
      this.ctx.address.get('core.oracles.pyth.registry'),
    ];
  }

  async prepare({
    txBlock,
    assetCoinNames,
    usePythPullModel,
    sponsoredFeeds,
    isSponsoredTx,
  }: PrepareParams): Promise<void> {
    const { logger, suiKit, address, pythEndpoint, pythApiKey } = this.ctx;
    // Pull-model: update every candidate. Push-model: only feeds that are NOT
    // sponsored (sponsored feeds are updated out-of-band).
    const needToUpdate = assetCoinNames.filter(
      (coin) => usePythPullModel || !sponsoredFeeds.has(coin)
    );
    if (needToUpdate.length === 0) return;
    const pythClient = new ScallopPythClient(
      suiKit.client,
      address.get('core.oracles.pyth.state'),
      address.get('core.oracles.pyth.wormholeState'),
      { ...PYTH_SPONSOR }
    );

    const priceIds = Array.from(
      new Set(
        needToUpdate.map((assetCoinName) =>
          address.get(`core.coins.${assetCoinName}.oracle.pyth.feed`)
        )
      )
    );

    // Push the accumulator update(s) on-chain — sponsored (Scallop pays the
    // per-feed base fee) or self-funded. Shared by both source paths below.
    const pushUpdate = (priceUpdateData: Buffer[]) =>
      isSponsoredTx
        ? pythClient.updatePriceFeedsWithSponsoredBaseUpdateFee(
            txBlock.txBlock,
            priceUpdateData,
            priceIds
          )
        : pythClient.updatePriceFeeds(
            txBlock.txBlock,
            priceUpdateData,
            priceIds
          );

    // If API key provided or still using old hermes endpoint, use the pyth client SDK instead
    if (pythApiKey || pythEndpoint === LEGACY_PYTH_HERMES_ENDPOINT) {
      // With an API key: fetch VAAs directly from Pyth (Hermes)
      try {
        const pythConnection = new SuiPriceServiceConnection(pythEndpoint, {
          accessToken: pythApiKey,
        });
        const response = await pythConnection.getPriceFeedsUpdateData(priceIds);
        await pushUpdate(response);
        return;
      } catch (e) {
        logger.warn('pyth price-feed update failed', {
          pythEndpoint,
          message: (e as Error)?.message,
        });
      }
    } else {
      // No API key: pull the price-update payload from the Scallop indexer,
      // which returns a single accumulator update covering the configured feeds.
      try {
        const { data } = IndexerApiResponse.parse(
          await this.ctx.indexer.get('/api/price/pyth')
        );
        if (!data.data) {
          this.ctx.logger.warn('indexer returned no pyth price-update data');
          return;
        }

        await pushUpdate([
          Buffer.from(
            data.data.replace(/^0x/, ''),
            data.encoding as BufferEncoding
          ),
        ]);
      } catch (e) {
        this.ctx.logger.warn('indexer pyth price-feed update failed', {
          message: (e as Error)?.message,
        });
      }
    }
  }
}

export { ScallopPythClient };
