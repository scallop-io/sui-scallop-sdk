import { SUI_CLOCK_OBJECT_ID, TransactionArgument } from '@mysten/sui.js';
import { SuiTxBlock, SuiTxArg } from '@scallop-io/sui-kit';
import { ScallopAddress } from '../models';

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
    coinType: string
  ) => void;
  takeCollateral: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinType: string
  ) => TransactionResult;
  deposit: (coin: SuiTxArg, coinType: string) => TransactionResult;
  depositEntry: (coin: SuiTxArg, coinType: string) => void;
  withdraw: (marketCoin: SuiTxArg, coinType: string) => TransactionResult;
  withdrawEntry: (marketCoin: SuiTxArg, coinType: string) => void;
  borrow: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinType: string
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinType: string
  ) => void;
  repay: (obligation: SuiTxArg, coin: SuiTxArg, coinType: string) => void;
  borrowFlashLoan: (amount: number, coinType: string) => TransactionResult;
  repayFlashLoan: (coin: SuiTxArg, loan: SuiTxArg, coinType: string) => void;
};

type ScallopMethodsHandler = {
  [key in keyof ScallopMethods]: (
    txBlock: SuiTxBlock,
    coreIds: CoreIds,
    scallopAddress?: ScallopAddress
  ) => ScallopMethods[key];
};

type CoreIds = {
  protocolPkg: string;
  market: string;
  version: string;
  dmlR: string; // coinDecimalsRegistry
  oracle: string;
};

// const scallopUtils = new ScallopUtils({ });

// const updateOracle = async (txBlock: SuiTxBlock, address: ScallopAddress) => {
//   const [vaaFromFeeId] = await scallopUtils.getVaas(
//     [address.get(`core.coins.${updateCoin}.oracle.pyth.feed`)],
//   );
// }

const scallopMethodsHandler: ScallopMethodsHandler = {
  openObligation: (txBlock, coreIds) => () =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::open_obligation::open_obligation`,
      [coreIds.version]
    ),
  returnObligation: (txBlock, coreIds) => (obligation, obligationHotPotato) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::return_obligation::return_obligation`,
      [coreIds.version, obligation, obligationHotPotato]
    ),
  openObligationEntry: (txBlock, coreIds) => () =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::open_obligation::open_obligation_entry`,
      [coreIds.version]
    ),
  addCollateral: (txBlock, coreIds) => (obligation, coin, coinType) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::deposit_collateral::deposit_collateral`,
      [coreIds.version, obligation, coreIds.market, coin],
      [coinType]
    ),
  takeCollateral:
    (txBlock, coreIds) => (obligation, obligationKey, amount, coinType) =>
      txBlock.moveCall(
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
      ),
  deposit: (txBlock, coreIds) => (coin, coinType) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::mint::mint`,
      [coreIds.version, coreIds.market, coin, SUI_CLOCK_OBJECT_ID],
      [coinType]
    ),
  depositEntry: (txBlock, coreIds) => (coin, coinType) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::mint::mint_entry`,
      [coreIds.version, coreIds.market, coin, SUI_CLOCK_OBJECT_ID],
      [coinType]
    ),
  withdraw: (txBlock, coreIds) => (marketCoin, coinType) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::redeem::redeem`,
      [coreIds.version, coreIds.market, marketCoin, SUI_CLOCK_OBJECT_ID],
      [coinType]
    ),
  withdrawEntry: (txBlock, coreIds) => (marketCoin, coinType) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::redeem::redeem_entry`,
      [coreIds.version, coreIds.market, marketCoin, SUI_CLOCK_OBJECT_ID],
      [coinType]
    ),
  borrow: (txBlock, coreIds) => (obligation, obligationKey, amount, coinType) =>
    txBlock.moveCall(
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
    ),
  borrowEntry:
    (txBlock, coreIds) => (obligation, obligationKey, amount, coinType) =>
      txBlock.moveCall(
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
      ),
  repay: (txBlock, coreIds) => (obligation, coin, coinType) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::repay::repay`,
      [coreIds.version, obligation, coreIds.market, coin, SUI_CLOCK_OBJECT_ID],
      [coinType]
    ),
  borrowFlashLoan: (txBlock, coreIds) => (amount, coinType) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::flash_loan::borrow_flash_loan`,
      [coreIds.version, coreIds.market, amount],
      [coinType]
    ),
  repayFlashLoan: (txBlock, coreIds) => (coin, loan, coinType) =>
    txBlock.moveCall(
      `${coreIds.protocolPkg}::flash_loan::repay_flash_loan`,
      [coreIds.version, coreIds.market, coin, loan],
      [coinType]
    ),
};

export const newTxBlock = (scallopAddress: ScallopAddress) => {
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
        return scallopMethodsHandler[prop as keyof ScallopMethodsHandler](
          target,
          coreIds,
          scallopAddress
        );
      }
      return target[prop as keyof SuiTxBlock];
    },
  });
  return txBlockProxy as SuiTxBlock & ScallopMethods;
};

// const address = new ScallopAddress({
//   id: '',
//   network: 'testnet',
// });

// const txBlock = newTxBlock(address);
