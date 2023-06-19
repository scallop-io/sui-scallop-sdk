import { Buffer } from 'node:buffer';
import { SUI_CLOCK_OBJECT_ID, TransactionArgument } from '@mysten/sui.js';
import { SuiTxBlock, SuiKit } from '@scallop-io/sui-kit';
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

const updateOracles = async (
  txBlock: SuiTxBlock,
  address: ScallopAddress,
  scallopUtils: ScallopUtils,
  coinNames: SupportCoins[],
  isTestnet: boolean
) => {
  const updateCoinTypes = [...new Set(coinNames)];
  for (const coinName of updateCoinTypes) {
    await updateOracle(txBlock, address, scallopUtils, coinName, isTestnet);
  }
};

const updateOracle = async (
  txBlock: SuiTxBlock,
  address: ScallopAddress,
  scallopUtils: ScallopUtils,
  coinName: SupportCoins,
  isTestnet: boolean
) => {
  const coinPackageId = address.get(`core.coins.${coinName}.id`);
  const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
  const [vaaFromFeeId] = await scallopUtils.getVaas(
    [address.get(`core.coins.${coinName}.oracle.pyth.feed`)],
    isTestnet
  );

  updatePrice(
    txBlock,
    isTestnet ? ['supra', 'pyth', 'switchboard'] : ['pyth'],
    address.get('core.packages.xOracle.id'),
    address.get('core.oracles.xOracle'),
    address.get('core.packages.pyth.id'),
    address.get('core.oracles.pyth.registry'),
    address.get('core.oracles.pyth.state'),
    address.get('core.oracles.pyth.wormholeState'),
    address.get(`core.coins.${coinName}.oracle.pyth.feedObject`),
    vaaFromFeeId,
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
 * @param pythWormholeStateId - The whormhole state id from pyth package.
 * @param pythFeedObjectId - The feed object id from pyth package.
 * @param pythVaaFromFeeId - The vaa from pyth api with feed id.
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
  pythWormholeStateId: TransactionArgument | string,
  pythFeedObjectId: TransactionArgument | string,
  pythVaaFromFeeId: string,
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
      pythWormholeStateId,
      pythFeedObjectId,
      pythVaaFromFeeId,
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
    [request, aggregatorId, registryId],
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
  wormholeStateId: TransactionArgument | string,
  feedObjectId: TransactionArgument | string,
  vaaFromFeeId: string,
  registryId: TransactionArgument | string,
  coinType: string
) {
  const [updateFee] = txBlock.splitSUIFromGas([1]);
  txBlock.moveCall(
    `${packageId}::rule::set_price`,
    [
      request,
      wormholeStateId,
      stateId,
      feedObjectId,
      registryId,
      txBlock.pure([...Buffer.from(vaaFromFeeId, 'base64')]),
      updateFee,
      SUI_CLOCK_OBJECT_ID,
    ],
    [coinType]
  );
}
