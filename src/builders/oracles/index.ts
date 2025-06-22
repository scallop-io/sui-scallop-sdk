import { updatePythPriceFeeds } from './pyth';
import { xOracleList as X_ORACLE_LIST } from 'src/constants';
import { PriceUpdater } from './priceUpdater';
import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import type { ScallopBuilder, ScallopUtils } from 'src/models';
import type { SupportOracleType, xOracleRules } from 'src/types';
import { OracleConfig } from './oracleConfig';

/**
 * Update the price of the oracle for multiple coin.
 *
 * @param builder - The scallop builder.
 * @param txBlock - TxBlock created by SuiKit.
 * @param assetCoinNames - Specific an array of support asset coin name.
 * @param options - The options for update oracles.
 */
export const updateOracles = async (
  builder: ScallopBuilder,
  txBlock: SuiKitTxBlock,
  assetCoinNames: string[] = [...builder.constants.whitelist.lending],
  options: {
    usePythPullModel: boolean;
    useOnChainXOracleList: boolean;
    sponsoredFeeds: string[];
  } = {
    usePythPullModel: true,
    useOnChainXOracleList: true,
    sponsoredFeeds: [],
  }
) => {
  const sponsoredFeeds = new Set(
    builder.sponsoredFeeds ?? options.sponsoredFeeds
  );

  // Validate the sponsoredFeeds content.
  sponsoredFeeds.forEach((feed) => {
    if (!builder.constants.whitelist.lending.has(feed)) {
      throw new Error(`${feed} is not valid feed`);
    }
  });

  const usePythPullModel = builder.usePythPullModel ?? options.usePythPullModel;
  const useOnChainXOracleList =
    builder.useOnChainXOracleList ?? options.useOnChainXOracleList;

  const xOracleList = useOnChainXOracleList
    ? await builder.query.getAssetOracles()
    : X_ORACLE_LIST;

  // const rules: SupportOracleType[] = builder.isTestnet ? ['pyth'] : ['pyth'];
  const flattenedRules = new Set(
    Object.values(xOracleList).flatMap(({ primary, secondary }) => [
      ...primary,
      ...secondary,
    ])
  );

  const filterAssetCoinNames = (
    assetCoinName: string,
    rule: SupportOracleType
  ) => {
    const assetXOracle = xOracleList[assetCoinName];
    return (
      assetXOracle &&
      (assetXOracle.primary.includes(rule) ||
        assetXOracle.secondary.includes(rule))
    );
  };

  const updateAssetCoinNames = [...new Set(assetCoinNames)];
  const pythAssetCoinNames = updateAssetCoinNames.filter((assetCoinName) =>
    filterAssetCoinNames(assetCoinName, 'pyth')
  );

  if (flattenedRules.has('pyth')) {
    const needToUpdatePythPriceFeeds: string[] = [];
    for (const pythAssetCoinName of pythAssetCoinNames) {
      /**
       * Check if the Pyth pull model is not used but the feed is not sponsored.
       * This is used to determine if we should update the Pyth price feeds.
       */
      const notUsingPullAndNotSponsored =
        !usePythPullModel && !sponsoredFeeds.has(pythAssetCoinName);

      if (usePythPullModel || notUsingPullAndNotSponsored) {
        needToUpdatePythPriceFeeds.push(pythAssetCoinName);
      }
    }

    if (needToUpdatePythPriceFeeds.length > 0) {
      await updatePythPriceFeeds(builder, needToUpdatePythPriceFeeds, txBlock);
    }
  }

  // Remove duplicate coin names.
  for (const assetCoinName of updateAssetCoinNames) {
    updateOracle(builder, txBlock, assetCoinName, xOracleList[assetCoinName]);
  }
};

/**
 * Update the price of the oracle for specific coin.
 * @param utils - Scallop util instance
 * @param txBlock - TxBlock created by SuiKit.
 * @param assetCoinName - Specific support asset coin name.
 * @param rules - Oracle rules
 */
const updateOracle = (
  { utils }: { utils: ScallopUtils },
  txBlock: SuiKitTxBlock,
  assetCoinName: string,
  rules: xOracleRules
) => {
  const coinType = utils.parseCoinType(assetCoinName);
  const config = new OracleConfig(
    utils.address,
    assetCoinName,
    coinType,
    rules
  );
  new PriceUpdater(config, {
    txBlock,
  }).updatePrice();
};
