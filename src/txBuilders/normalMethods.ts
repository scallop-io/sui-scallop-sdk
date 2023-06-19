import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { ScallopAddress, ScallopUtils } from '../models';
import type {
  ScallopNormalMethodsHandler,
  SuiTxBlockWithNormalScallopMethods,
  CoreIds,
} from '../types';

const scallopNormalMethodsHandler: ScallopNormalMethodsHandler = {
  openObligation:
    ({ txBlock, coreIds }) =>
    () =>
      txBlock.moveCall(
        `${coreIds.protocolPkg}::open_obligation::open_obligation`,
        [coreIds.version]
      ),
  returnObligation:
    ({ txBlock, coreIds }) =>
    (obligation, obligationHotPotato) =>
      txBlock.moveCall(
        `${coreIds.protocolPkg}::return_obligation::return_obligation`,
        [coreIds.version, obligation, obligationHotPotato]
      ),
  openObligationEntry:
    ({ txBlock, coreIds }) =>
    () =>
      txBlock.moveCall(
        `${coreIds.protocolPkg}::open_obligation::open_obligation_entry`,
        [coreIds.version]
      ),
  addCollateral:
    ({ txBlock, coreIds, scallopUtils, scallopAddress }) =>
    (obligation, coin, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::deposit_collateral::deposit_collateral`,
        [coreIds.version, obligation, coreIds.market, coin],
        [coinType]
      );
    },
  takeCollateral:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (obligation, obligationKey, amount, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::withdraw_collateral::withdraw_collateral`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.dmlR,
          amount,
          coreIds.oracle,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
  deposit:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (coin, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::mint::mint`,
        [coreIds.version, coreIds.market, coin, SUI_CLOCK_OBJECT_ID],
        [coinType]
      );
    },
  depositEntry:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (coin, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::mint::mint_entry`,
        [coreIds.version, coreIds.market, coin, SUI_CLOCK_OBJECT_ID],
        [coinType]
      );
    },
  withdraw:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (marketCoin, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::redeem::redeem`,
        [coreIds.version, coreIds.market, marketCoin, SUI_CLOCK_OBJECT_ID],
        [coinType]
      );
    },
  withdrawEntry:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (marketCoin, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::redeem::redeem_entry`,
        [coreIds.version, coreIds.market, marketCoin, SUI_CLOCK_OBJECT_ID],
        [coinType]
      );
    },
  borrow:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (obligation, obligationKey, amount, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::borrow::borrow`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.dmlR,
          amount,
          coreIds.oracle,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
  borrowEntry:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (obligation, obligationKey, amount, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::borrow::borrow_entry`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.dmlR,
          amount,
          coreIds.oracle,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
  repay:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (obligation, coin, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::repay::repay`,
        [
          coreIds.version,
          obligation,
          coreIds.market,
          coin,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
  borrowFlashLoan:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (amount, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::flash_loan::borrow_flash_loan`,
        [coreIds.version, coreIds.market, amount],
        [coinType]
      );
    },
  repayFlashLoan:
    ({ txBlock, coreIds, scallopAddress, scallopUtils }) =>
    (coin, loan, coinName) => {
      const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
      const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::flash_loan::repay_flash_loan`,
        [coreIds.version, coreIds.market, coin, loan],
        [coinType]
      );
    },
};

export const newTxBlock = (
  scallopAddress: ScallopAddress,
  scallopUtils: ScallopUtils
) => {
  const coreIds: CoreIds = {
    protocolPkg: scallopAddress.get('core.packages.protocol.id'),
    market: scallopAddress.get('core.market'),
    version: scallopAddress.get('core.version'),
    dmlR: scallopAddress.get('core.coinDecimalsRegistry'),
    oracle: scallopAddress.get('core.oracles.xOracle'),
  };
  const txBlock = new SuiTxBlock();
  const txBlockProxy = new Proxy(txBlock, {
    get: (target, prop) => {
      if (prop in scallopNormalMethodsHandler) {
        return scallopNormalMethodsHandler[
          prop as keyof ScallopNormalMethodsHandler
        ]({
          txBlock: target,
          coreIds,
          scallopAddress,
          scallopUtils,
        });
      }
      return target[prop as keyof SuiTxBlock];
    },
  });
  return txBlockProxy as SuiTxBlockWithNormalScallopMethods;
};
