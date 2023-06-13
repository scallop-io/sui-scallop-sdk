import { SUI_CLOCK_OBJECT_ID, TransactionArgument } from '@mysten/sui.js';
import { SuiTxBlock, SuiTxArg } from '@scallop-io/sui-kit';
import { ScallopAddress, ScallopUtils } from '../models';
import { SupportCollateralCoins, SupportAssetCoins } from '../types';

type TransactionResult = TransactionArgument & TransactionArgument[];

type ScallopMethods = {
  openObligation: () => TransactionResult;
  returnObligation: (
    obligation: SuiTxArg,
    obligationHotPotato: SuiTxArg
  ) => void;
  openObligationEntry: () => void;
  addCollateral: (
    obligation: SuiTxArg,
    coin: SuiTxArg,
    coinName: SupportCollateralCoins
  ) => void;
  takeCollateral: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportCollateralCoins
  ) => TransactionResult;
  deposit: (coin: SuiTxArg, coinName: SupportAssetCoins) => TransactionResult;
  depositEntry: (coin: SuiTxArg, coinName: SupportAssetCoins) => void;
  withdraw: (
    marketCoin: SuiTxArg,
    coinName: SupportAssetCoins
  ) => TransactionResult;
  withdrawEntry: (marketCoin: SuiTxArg, coinName: SupportAssetCoins) => void;
  borrow: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportAssetCoins
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportAssetCoins
  ) => void;
  repay: (
    obligation: SuiTxArg,
    coin: SuiTxArg,
    coinName: SupportAssetCoins
  ) => void;
  borrowFlashLoan: (
    amount: number,
    coinName: SupportAssetCoins
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiTxArg,
    loan: SuiTxArg,
    coinName: SupportAssetCoins
  ) => void;
};

type ScallopMethodsHandler = {
  [key in keyof ScallopMethods]: (params: {
    txBlock: SuiTxBlock;
    coreIds: CoreIds;
    scallopAddress: ScallopAddress;
    scallopUtils: ScallopUtils;
  }) => ScallopMethods[key];
};

type CoreIds = {
  protocolPkg: string;
  market: string;
  version: string;
  dmlR: string; // coinDecimalsRegistry
  oracle: string;
};

const scallopMethodsHandler: ScallopMethodsHandler = {
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

export type SuiTxBlockWithSimpleScallopMethods = SuiTxBlock & ScallopMethods;
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
      if (prop in scallopMethodsHandler) {
        return scallopMethodsHandler[prop as keyof ScallopMethodsHandler]({
          txBlock: target,
          coreIds,
          scallopAddress,
          scallopUtils,
        });
      }
      return target[prop as keyof SuiTxBlock];
    },
  });
  return txBlockProxy as SuiTxBlockWithSimpleScallopMethods;
};

// const address = new ScallopAddress({
//   id: '',
//   network: 'testnet',
// });

// const txBlock = newTxBlock(address);
