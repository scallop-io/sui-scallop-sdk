import { SUI_CLOCK_OBJECT_ID, TransactionArgument } from '@mysten/sui.js';
import { SuiTxBlock, SuiKit } from '@scallop-io/sui-kit';
import {
  SuiPythClient,
  SuiPriceServiceConnection,
} from '@pythnetwork/pyth-sui-js';
import { ScallopAddress, ScallopUtils } from '../models';
import { SupportCoins, SupportAssetCoins, SupportOracleType } from '../types';
import { queryObligation } from '../queries';

export const updateOraclesForWithdrawCollateral = async (
  txBlock: SuiTxBlock,
  address: ScallopAddress,
  scallopUtils: ScallopUtils,
  suiKit: SuiKit,
  obligationId: string,
  isTestnet: boolean
) => {
  const obligationCoinNames = await getObligationCoinNames(
    suiKit,
    obligationId,
    address,
    scallopUtils
  );
  return updateOracles(
    txBlock,
    suiKit,
    address,
    scallopUtils,
    obligationCoinNames,
    isTestnet
  );
};

export const updateOraclesForLiquidation = async (
  txBlock: SuiTxBlock,
  address: ScallopAddress,
  scallopUtils: ScallopUtils,
  suiKit: SuiKit,
  obligationId: string,
  isTestnet: boolean
) => {
  const obligationCoinNames = await getObligationCoinNames(
    suiKit,
    obligationId,
    address,
    scallopUtils
  );
  return updateOracles(
    txBlock,
    suiKit,
    address,
    scallopUtils,
    obligationCoinNames,
    isTestnet
  );
};

export const updateOraclesForBorrow = async (
  txBlock: SuiTxBlock,
  address: ScallopAddress,
  scallopUtils: ScallopUtils,
  suiKit: SuiKit,
  obligationId: string,
  borrowCoinName: SupportAssetCoins,
  isTestnet: boolean
) => {
  const obligationCoinNames = await getObligationCoinNames(
    suiKit,
    obligationId,
    address,
    scallopUtils
  );
  const updateCoinNames = [
    ...new Set([...obligationCoinNames, borrowCoinName]),
  ];
  return updateOracles(
    txBlock,
    suiKit,
    address,
    scallopUtils,
    updateCoinNames,
    isTestnet
  );
};

const getObligationCoinNames = async (
  suiKit: SuiKit,
  obligationId: string,
  address: ScallopAddress,
  scallopUtils: ScallopUtils
) => {
  const obligation = await queryObligation(obligationId, address, suiKit);
  const collateralCoinTypes = obligation.collaterals.map((collateral) => {
    return `0x${collateral.type.name}`;
  });
  const debtCoinTypes = obligation.debts.map((debt) => {
    return `0x${debt.type.name}`;
  });
  const obligationCoinTypes = [
    ...new Set([...collateralCoinTypes, ...debtCoinTypes]),
  ];
  const obligationCoinNames = obligationCoinTypes.map((coinType) => {
    return scallopUtils.getCoinNameFromCoinType(coinType);
  });
  return obligationCoinNames;
};

export const updateOracles = async (
  txBlock: SuiTxBlock,
  suiKit: SuiKit,
  address: ScallopAddress,
  scallopUtils: ScallopUtils,
  coinNames: SupportCoins[],
  isTestnet: boolean
) => {
  const rules: SupportOracleType[] = isTestnet ? ['pyth'] : ['pyth'];
  if (rules.includes('pyth')) {
    const pythClient = new SuiPythClient(
      suiKit.provider(),
      address.get('core.oracles.pyth.state'),
      address.get('core.oracles.pyth.wormholeState')
    );
    const priceIds = coinNames.map((coinName) =>
      address.get(`core.coins.${coinName}.oracle.pyth.feed`)
    );
    const pythConnection = new SuiPriceServiceConnection(
      isTestnet
        ? 'https://xc-testnet.pyth.network'
        : 'https://xc-mainnet.pyth.network'
    );
    const priceUpdateData = await pythConnection.getPriceFeedsUpdateData(
      priceIds
    );
    await pythClient.updatePriceFeeds(
      txBlock.txBlock,
      priceUpdateData,
      priceIds
    );
  }

  for (const coinName of coinNames) {
    await updateOracle(txBlock, rules, address, scallopUtils, coinName);
  }
};

const updateOracle = async (
  txBlock: SuiTxBlock,
  rules: SupportOracleType[],
  address: ScallopAddress,
  scallopUtils: ScallopUtils,
  coinName: SupportCoins
) => {
  const coinPackageId = address.get(`core.coins.${coinName}.id`);
  const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);

  // TODO: use address.get() to get the address after API upgrate
  const xOraclePkgId =
    '0x8148535d4a3f22d09468a9e101ec10ef8803c94e7aae3993897907aeec288f32';
  const xOracleId =
    '0xeed0701ca3bfb7ec85c452ef06778d6f291499ab1ce32a4f98097d7a678360e0';
  const pythRulePkgId =
    '0x87085e186a7c7f7cd8635288be45791a893fca6f8c0a5d253a644f4288a43a07';
  const pythRuleRegistryId =
    '0x172498250129a385f7f58d3ebcb8b48dd118d850bdd50ca6779e1468c366f408';

  updatePrice(
    txBlock,
    rules,
    // address.get('core.packages.xOracle.id'),
    // address.get('core.oracles.xOracle'),
    // address.get('core.packages.pyth.id'),
    // address.get('core.oracles.pyth.registry'),
    xOraclePkgId,
    xOracleId,
    pythRulePkgId,
    pythRuleRegistryId,
    address.get('core.oracles.pyth.state'),
    address.get(`core.coins.${coinName}.oracle.pyth.feedObject`),
    address.get('core.packages.switchboard.id'),
    address.get('core.oracles.switchboard.registry'),
    address.get(`core.coins.${coinName}.oracle.switchboard`),
    address.get('core.packages.supra.id'),
    address.get('core.oracles.supra.registry'),
    address.get(`core.oracles.supra.holder`),
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
 * @returns Sui-Kit type transaction block.
 */
function updatePrice(
  txBlock: SuiTxBlock,
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
) {
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
}

/**
 * Construct a transaction block for request price update.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The xOracle package id.
 * @param xOracleId - The xOracle Id from xOracle package.
 * @param coinType - The type of coin.
 * @returns Sui-Kit type transaction block.
 */
function priceUpdateRequest(
  txBlock: SuiTxBlock,
  packageId: string,
  xOracleId: TransactionArgument | string,
  coinType: string
) {
  const target = `${packageId}::x_oracle::price_update_request`;
  const typeArgs = [coinType];
  return txBlock.moveCall(target, [xOracleId], typeArgs);
}

/**
 * Construct a transaction block for confirm price update request.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The xOracle package id.
 * @param xOracleId - The xOracle Id from xOracle package.
 * @param request - The result of the request.
 * @param coinType - The type of coin.
 * @returns Sui-Kit type transaction block.
 */
function confirmPriceUpdateRequest(
  txBlock: SuiTxBlock,
  packageId: string,
  xOracleId: TransactionArgument | string,
  request: TransactionArgument,
  coinType: string
) {
  const target = `${packageId}::x_oracle::confirm_price_update_request`;
  const typeArgs = [coinType];
  txBlock.moveCall(target, [xOracleId, request, SUI_CLOCK_OBJECT_ID], typeArgs);
  return txBlock;
}

/**
 * Construct a transaction block for update supra price.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The supra package id.
 * @param request - The result of the request.
 * @param holderId - The holder id from supra package.
 * @param registryId - The registry id from supra package.
 * @param coinType - The type of coin.
 * @returns Sui-Kit type transaction block.
 */
function updateSupraPrice(
  txBlock: SuiTxBlock,
  packageId: string,
  request: TransactionArgument,
  holderId: TransactionArgument | string,
  registryId: TransactionArgument | string,
  coinType: string
) {
  txBlock.moveCall(
    `${packageId}::rule::set_price`,
    [request, holderId, registryId, SUI_CLOCK_OBJECT_ID],
    [coinType]
  );
}

/**
 * Construct a transaction block for update switchboard price.
 *
 * @param txBlock - The transaction block.
 * @param packageId - The switchboard package id.
 * @param request - The result of the request.
 * @param aggregatorId - The aggregator id from switchboard package.
 * @param registryId - The registry id from switchboard package.
 * @param coinType - The type of coin.
 * @returns Sui-Kit type transaction block.
 */
function updateSwitchboardPrice(
  txBlock: SuiTxBlock,
  packageId: string,
  request: TransactionArgument,
  aggregatorId: TransactionArgument | string,
  registryId: TransactionArgument | string,
  coinType: string
) {
  txBlock.moveCall(
    `${packageId}::rule::set_price`,
    [request, aggregatorId, registryId, SUI_CLOCK_OBJECT_ID],
    [coinType]
  );
}

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
 * @returns Sui-Kit type transaction block.
 */
function updatePythPrice(
  txBlock: SuiTxBlock,
  packageId: string,
  request: TransactionArgument,
  stateId: TransactionArgument | string,
  feedObjectId: TransactionArgument | string,
  registryId: TransactionArgument | string,
  coinType: string
) {
  txBlock.moveCall(
    `${packageId}::rule::set_price`,
    [request, stateId, feedObjectId, registryId, SUI_CLOCK_OBJECT_ID],
    [coinType]
  );
}
