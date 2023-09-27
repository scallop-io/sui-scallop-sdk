import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import type { TransactionArgument } from '@mysten/sui.js/transactions';
import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import {
  SuiPythClient,
  SuiPriceServiceConnection,
} from '@pythnetwork/pyth-sui-js';
import type { ScallopBuilder } from '../models';
import type { SupportCoins, SupportOracleType } from '../types';

/**
 * Update the price of the oracle for multiple coin.
 *
 * @param builder - The scallop builder.
 * @param txBlock - TxBlock created by SuiKit.
 * @param coinNames - The coin names.
 */
export const updateOracles = async (
  builder: ScallopBuilder,
  txBlock: SuiKitTxBlock,
  coinNames: SupportCoins[]
) => {
  const rules: SupportOracleType[] = builder.isTestnet ? ['pyth'] : ['pyth'];
  if (rules.includes('pyth')) {
    const pythClient = new SuiPythClient(
      builder.suiKit.client(),
      builder.address.get('core.oracles.pyth.state'),
      builder.address.get('core.oracles.pyth.wormholeState')
    );
    const priceIds = coinNames.map((coinName) =>
      builder.address.get(`core.coins.${coinName}.oracle.pyth.feed`)
    );
    const pythConnection = new SuiPriceServiceConnection(
      builder.isTestnet
        ? 'https://hermes-beta.pyth.network'
        : 'https://hermes.pyth.network'
    );
    const priceUpdateData =
      await pythConnection.getPriceFeedsUpdateData(priceIds);
    await pythClient.updatePriceFeeds(
      txBlock.txBlock,
      priceUpdateData,
      priceIds
    );
  }

  // Remove duplicate coin names.
  const updateCoinTypes = [...new Set(coinNames)];
  for (const coinName of updateCoinTypes) {
    await updateOracle(builder, txBlock, coinName, rules);
  }
};

/**
 * Update the price of the oracle for specific coin.
 *
 * @param builder - The scallop builder.
 * @param txBlock - TxBlock created by SuiKit.
 * @param coinName - The coin name.
 */
const updateOracle = async (
  builder: ScallopBuilder,
  txBlock: SuiKitTxBlock,
  coinName: SupportCoins,
  rules: SupportOracleType[]
) => {
  const coinPackageId = builder.address.get(`core.coins.${coinName}.id`);
  const coinType = builder.utils.parseCoinType(coinPackageId, coinName);

  updatePrice(
    txBlock,
    rules,
    builder.address.get('core.packages.xOracle.id'),
    builder.address.get('core.oracles.xOracle'),
    builder.address.get('core.packages.pyth.id'),
    builder.address.get('core.oracles.pyth.registry'),
    builder.address.get('core.oracles.pyth.state'),
    builder.address.get(`core.coins.${coinName}.oracle.pyth.feedObject`),
    builder.address.get('core.packages.switchboard.id'),
    builder.address.get('core.oracles.switchboard.registry'),
    builder.address.get(`core.coins.${coinName}.oracle.switchboard`),
    builder.address.get('core.packages.supra.id'),
    builder.address.get('core.oracles.supra.registry'),
    builder.address.get(`core.oracles.supra.holder`),
    coinType
  );
};

/**
 * Construct a transaction block for update the price.
 *
 * @param txBlock - The transaction block.
 * @param rules - The oracle rules.
 * @param xOraclePackageId - The xOracle package id.
 * @param xOracleId - The xOracle Id from xOracle package.
 * @param pythPackageId - The pyth package id.
 * @param pythRegistryId - The registry id from pyth package.
 * @param pythStateId - The price state id from pyth package.
 * @param pythFeedObjectId - The feed object id from pyth package.
 * @param switchboardPackageId - The switchboard package id.
 * @param switchboardRegistryId - The registry id from switchboard package.
 * @param switchboardAggregatorId - The aggregator id from switchboard package.
 * @param supraPackageId - The supra package id.
 * @param supraRegistryId - The registry id from supra package.
 * @param supraHolderId - The holder id from supra package.
 * @param coinType - The type of coin.
 * @returns TxBlock created by SuiKit.
 */
const updatePrice = (
  txBlock: SuiKitTxBlock,
  rules: SupportOracleType[],
  xOraclePackageId: string,
  xOracleId: TransactionArgument | string,
  pythPackageId: string,
  pythRegistryId: TransactionArgument | string,
  pythStateId: TransactionArgument | string,
  pythFeedObjectId: TransactionArgument | string,
  switchboardPackageId: string,
  switchboardRegistryId: TransactionArgument | string,
  switchboardAggregatorId: TransactionArgument | string,
  supraPackageId: string,
  supraRegistryId: TransactionArgument | string,
  supraHolderId: TransactionArgument | string,
  coinType: string
) => {
  const request = priceUpdateRequest(
    txBlock,
    xOraclePackageId,
    xOracleId,
    coinType
  );
  if (rules.includes('pyth')) {
    updatePythPrice(
      txBlock,
      pythPackageId,
      request,
      pythStateId,
      pythFeedObjectId,
      pythRegistryId,
      coinType
    );
  }
  if (rules.includes('switchboard')) {
    updateSwitchboardPrice(
      txBlock,
      switchboardPackageId,
      request,
      switchboardAggregatorId,
      switchboardRegistryId,
      coinType
    );
  }
  if (rules.includes('supra')) {
    updateSupraPrice(
      txBlock,
      supraPackageId,
      request,
      supraHolderId,
      supraRegistryId,
      coinType
    );
  }
  confirmPriceUpdateRequest(
    txBlock,
    xOraclePackageId,
    xOracleId,
    request,
    coinType
  );
  return txBlock;
};

/**
 * Construct a transaction block for request price update.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The xOracle package id.
 * @param xOracleId - The xOracle Id from xOracle package.
 * @param coinType - The type of coin.
 * @returns TxBlock created by SuiKit.
 */
const priceUpdateRequest = (
  txBlock: SuiKitTxBlock,
  packageId: string,
  xOracleId: TransactionArgument | string,
  coinType: string
) => {
  const target = `${packageId}::x_oracle::price_update_request`;
  const typeArgs = [coinType];
  return txBlock.moveCall(target, [xOracleId], typeArgs);
};

/**
 * Construct a transaction block for confirm price update request.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The xOracle package id.
 * @param xOracleId - The xOracle Id from xOracle package.
 * @param request - The result of the request.
 * @param coinType - The type of coin.
 * @returns TxBlock created by SuiKit.
 */
const confirmPriceUpdateRequest = (
  txBlock: SuiKitTxBlock,
  packageId: string,
  xOracleId: TransactionArgument | string,
  request: TransactionArgument,
  coinType: string
) => {
  const target = `${packageId}::x_oracle::confirm_price_update_request`;
  const typeArgs = [coinType];
  txBlock.moveCall(target, [xOracleId, request, SUI_CLOCK_OBJECT_ID], typeArgs);
  return txBlock;
};

/**
 * Construct a transaction block for update supra price.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The supra package id.
 * @param request - The result of the request.
 * @param holderId - The holder id from supra package.
 * @param registryId - The registry id from supra package.
 * @param coinType - The type of coin.
 * @returns TxBlock created by SuiKit.
 */
const updateSupraPrice = (
  txBlock: SuiKitTxBlock,
  packageId: string,
  request: TransactionArgument,
  holderId: TransactionArgument | string,
  registryId: TransactionArgument | string,
  coinType: string
) => {
  txBlock.moveCall(
    `${packageId}::rule::set_price`,
    [request, holderId, registryId, SUI_CLOCK_OBJECT_ID],
    [coinType]
  );
};

/**
 * Construct a transaction block for update switchboard price.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The switchboard package id.
 * @param request - The result of the request.
 * @param aggregatorId - The aggregator id from switchboard package.
 * @param registryId - The registry id from switchboard package.
 * @param coinType - The type of coin.
 * @returns TxBlock created by SuiKit.
 */
const updateSwitchboardPrice = (
  txBlock: SuiKitTxBlock,
  packageId: string,
  request: TransactionArgument,
  aggregatorId: TransactionArgument | string,
  registryId: TransactionArgument | string,
  coinType: string
) => {
  txBlock.moveCall(
    `${packageId}::rule::set_price`,
    [request, aggregatorId, registryId, SUI_CLOCK_OBJECT_ID],
    [coinType]
  );
};

/**
 * Construct a transaction block for update pyth price.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The pyth package id.
 * @param request - The result of the request.
 * @param stateId - The price state id from pyth package.
 * @param wormholeStateId - The whormhole state id from pyth package.
 * @param feedObjectId - The feed object id from pyth package.
 * @param vaaFromFeeId - The vaa from pyth api with feed id.
 * @param registryId - The registry id from pyth package.
 * @param coinType - The type of coin.
 * @returns TxBlock created by SuiKit.
 */
const updatePythPrice = (
  txBlock: SuiKitTxBlock,
  packageId: string,
  request: TransactionArgument,
  stateId: TransactionArgument | string,
  feedObjectId: TransactionArgument | string,
  registryId: TransactionArgument | string,
  coinType: string
) => {
  txBlock.moveCall(
    `${packageId}::rule::set_price`,
    [request, stateId, feedObjectId, registryId, SUI_CLOCK_OBJECT_ID],
    [coinType]
  );
};
