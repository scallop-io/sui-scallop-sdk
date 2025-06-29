import { X_ORACLE_LIST } from 'src/constants/xoracle';
import { createXOracleUpdater, IXOracleUpdater } from './xOracleUpdater';
import {
  createPackageRegistry,
  XOraclePackageRegistry,
} from './oraclePackageRegistry';
import {
  createPriceFeedUpdater,
  PriceFeedUpdateOptions,
} from './priceFeedUpdater';
import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import type { ScallopBuilder } from 'src/models';
import type { SupportOracleType, xOracleRuleType } from 'src/types/constant';
import { PriceUpdateRequester } from './priceUpdateRequester';
import { UnsupportedOracleError } from './error';

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
  options: Partial<PriceFeedUpdateOptions> = {}
) => {
  // Validate the options
  assetCoinNames = [...new Set(assetCoinNames)]; // Remove duplicates
  const mergedOptions = {
    usePythPullModel: builder.usePythPullModel,
    useOnChainXOracleList: builder.useOnChainXOracleList,
    pythSponsoredFeeds: builder.pythSponsoredFeeds,
    ...options,
  } as PriceFeedUpdateOptions;

  // Retrieve the xOracle list from the builder or use the default one.
  const xOracleList = mergedOptions.useOnChainXOracleList
    ? await builder.query.getAssetOracles()
    : X_ORACLE_LIST; // Record<coinName, Record<xOracleRuleType, SupportOracleType[]>>

  const xOracleListAsSet = Object.entries(xOracleList).reduce(
    (acc, [coinName, { primary, secondary }]) => {
      acc[coinName] = {
        primary: new Set(primary),
        secondary: new Set(secondary),
      };
      return acc;
    },
    {} as Record<string, Record<xOracleRuleType, Set<SupportOracleType>>>
  );

  // Get all oracle types no duplicates from all rules (primary and secondary).
  const oracleTypesSet = new Set(
    Object.values(xOracleList).flatMap(({ primary, secondary }) => [
      ...primary,
      ...secondary,
    ])
  );

  const getRuleType = (
    assetCoinName: string,
    oracleType: SupportOracleType
  ) => {
    const ruleSet = xOracleListAsSet[assetCoinName];
    if (!ruleSet)
      return {
        isPrimary: false,
        isSecondary: false,
      };

    const { primary, secondary } = ruleSet;
    const isPrimary = primary.has(oracleType);
    const isSecondary = secondary.has(oracleType);

    return {
      isPrimary,
      isSecondary,
    };
  };

  // Create a package registry for xOracle
  const xOraclePackageRegistry = new XOraclePackageRegistry(builder.utils);

  // Create xOracle updater for each oracle type
  const xOracleUpdaters: Partial<Record<SupportOracleType, IXOracleUpdater>> =
    {};

  // Iterate through oracle set
  for (const oracleType of oracleTypesSet) {
    const filteredAssetCoinNames = assetCoinNames.filter((assetCoinName) => {
      const { isPrimary, isSecondary } = getRuleType(assetCoinName, oracleType);
      if (!isPrimary && !isSecondary) return false;
      return true;
    });

    if (filteredAssetCoinNames.length > 0) {
      // Update all necessary price feeds
      await createPriceFeedUpdater(
        oracleType,
        txBlock,
        builder,
        filteredAssetCoinNames,
        mergedOptions
      ).updatePriceFeeds();
    }

    // Create the xOracle updater for the current oracle type
    xOracleUpdaters[oracleType] = createXOracleUpdater(
      txBlock,
      createPackageRegistry(oracleType, xOraclePackageRegistry)
    );
  }

  // Create a price update requester
  const priceUpdateRequester = new PriceUpdateRequester(
    txBlock,
    xOraclePackageRegistry
  );

  for (const assetCoinName of assetCoinNames) {
    const rules = xOracleList[assetCoinName];

    // build the price update request for the asset coin
    // Each coin name has its own price update request
    const updateRequest = priceUpdateRequester.buildRequest(assetCoinName);

    // Iterate through each rule and update the xOracle for each oracle type
    Object.keys(rules).forEach((rule) => {
      const oracles = rules[rule as xOracleRuleType];
      oracles.forEach((oracleType) => {
        const updater = xOracleUpdaters[oracleType];
        if (!updater) {
          // Should never happen if ORACLE_TYPES is the source of truth
          throw new UnsupportedOracleError(oracleType);
        }
        updater.updateXOracle(
          assetCoinName,
          rule as xOracleRuleType,
          updateRequest
        );
      });
    });

    // Confirm the price update request for all oracles
    priceUpdateRequester.confirmRequest(assetCoinName, updateRequest);
  }
};
