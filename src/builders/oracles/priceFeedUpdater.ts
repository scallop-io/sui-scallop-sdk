import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from '@pythnetwork/pyth-sui-js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models';
import { SupportOracleType } from 'src/types';

type PythPriceFeedUpdateOptions = {
  usePythPullModel: boolean;
  useOnChainXOracleList: boolean;
  pythSponsoredFeeds: string[];
};

type SupraPriceFeedUpdateOptions = {};
type SwitchboardPriceFeedUpdateOptions = {};

export type PriceFeedUpdateOptions = PythPriceFeedUpdateOptions &
  SupraPriceFeedUpdateOptions &
  SwitchboardPriceFeedUpdateOptions;

export interface IPriceFeedUpdater {
  oracleName: SupportOracleType;
  updatePriceFeeds(): Promise<void>;
}

class PythPriceFeedUpdater implements IPriceFeedUpdater {
  public readonly oracleName: SupportOracleType = 'pyth';

  constructor(
    public readonly tx: SuiTxBlock,
    private readonly builder: ScallopBuilder,
    private readonly coinNames: string[],
    private readonly options: {
      usePythPullModel: boolean;
      useOnChainXOracleList: boolean;
      pythSponsoredFeeds: string[];
    }
  ) {}

  private filterSponsoredFeeds() {
    const { usePythPullModel, pythSponsoredFeeds } = this.options;
    const sponsoredFeedsSet = new Set(pythSponsoredFeeds);

    return this.coinNames.filter((coinName) => {
      const notUsingPullAndNotSponsored =
        !usePythPullModel && !sponsoredFeedsSet.has(coinName);
      return usePythPullModel || notUsingPullAndNotSponsored;
    });
  }

  async updatePriceFeeds(): Promise<void> {
    const pythClient = new SuiPythClient(
      this.builder.suiKit.client,
      this.builder.address.get('core.oracles.pyth.state'),
      this.builder.address.get('core.oracles.pyth.wormholeState')
    );
    const filteredCoinNames = this.filterSponsoredFeeds();
    if (filteredCoinNames.length === 0) {
      return;
    }
    const priceIds = filteredCoinNames.map((assetCoinName) =>
      this.builder.address.get(`core.coins.${assetCoinName}.oracle.pyth.feed`)
    );

    // iterate through the endpoints
    const endpoints = this.builder.utils.pythEndpoints ?? [
      ...this.builder.constants.whitelist.pythEndpoints,
    ];
    for (const endpoint of endpoints) {
      try {
        const pythConnection = new SuiPriceServiceConnection(endpoint);
        const priceUpdateData =
          await pythConnection.getPriceFeedsUpdateData(priceIds);
        await pythClient.updatePriceFeeds(
          this.tx.txBlock,
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
  }
}

export const createPriceFeedUpdater = (
  oracleName: SupportOracleType,
  tx: SuiTxBlock,
  builder: ScallopBuilder,
  coinNames: string[],
  options: {
    usePythPullModel: boolean;
    useOnChainXOracleList: boolean;
    pythSponsoredFeeds: string[];
  }
) => {
  switch (oracleName) {
    case 'pyth':
      return new PythPriceFeedUpdater(tx, builder, coinNames, options);
    case 'supra':
      throw new Error('Supra price feed updater is not implemented yet.');
    case 'switchboard':
      throw new Error('Switchboard price feed updater is not implemented yet.');
    default:
      throw new Error(`Unsupported oracle type: ${oracleName}`);
  }
};
