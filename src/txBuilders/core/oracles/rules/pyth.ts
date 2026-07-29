import type { SuiObjectArg } from '@scallop-io/sui-kit';
import { PYTH_SPONSOR } from 'src/constants/index.js';
import type { SupportOracleType } from 'src/types/index.js';
import {
  BaseOracleRule,
  type PrepareParams,
  type SetPriceParams,
} from './types.js';
import { ScallopPythClient } from 'src/models/scallopPythClient.js';

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
      {
        ...PYTH_SPONSOR,
        pythEndpoint,
        pythApiKey,
        indexerUrl: this.ctx.indexer.url,
      }
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

    try {
      const response = await pythClient.getPriceFeedsUpdateData(priceIds);
      await pushUpdate(response);
    } catch (e) {
      logger.warn('pyth price-feed update failed', {
        message: (e as Error)?.message,
      });
    }
  }
}
