/**
 * This file contains the complex transaction builder, which contains multiple calls in a single transaction.
 */
import { SuiTxBlock, SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress, ScallopUtils } from '../models';
import { getObligations } from '../queries';
import { newTxBlock } from './normalMethods';
import {
  updateOraclesForBorrow,
  updateOraclesForWithdrawCollateral,
  updateOracles,
} from './oracle';
import { selectCoin, selectMarketCoin } from './coin';
import type { SuiTxArg } from '@scallop-io/sui-kit';
import type { ScallopQuickMethodsHandler, ScallopTxBlock } from '../types';

const requireSender = (txBlock: SuiTxBlock) => {
  const sender = txBlock.blockData.sender;
  if (!sender) {
    throw new Error('Sender is required');
  }
  return sender;
};

const requireObligationInfo = async (
  ...args: [
    txBlock: SuiTxBlock,
    scallopAddress: ScallopAddress,
    suiKit: SuiKit,
    obligationId?: SuiTxArg | undefined,
    obligationKey?: SuiTxArg | undefined,
  ]
) => {
  const [txBlock, scallopAddress, suiKit, obligationId, obligationKey] = args;
  if (args.length === 4 && obligationId) return { obligationId };
  if (args.length === 5 && obligationId && obligationKey)
    return { obligationId, obligationKey };
  const sender = requireSender(txBlock);
  const obligations = await getObligations(sender, scallopAddress, suiKit);
  if (obligations.length === 0) {
    throw new Error(`No obligation found for sender ${sender}`);
  }
  return {
    obligationId: obligations[0].id,
    obligationKey: obligations[0].keyId,
  };
};

const scallopQuickMethodsHandler: ScallopQuickMethodsHandler = {
  addCollateralQuick:
    ({ txBlock, scallopAddress, scallopUtils, suiKit }) =>
    async (amount, coinName, obligationId) => {
      const sender = requireSender(txBlock);
      const { obligationId: obligationArg } = await requireObligationInfo(
        txBlock,
        scallopAddress,
        suiKit,
        obligationId
      );

      if (coinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        txBlock.addCollateral(obligationArg, suiCoin, coinName);
      } else {
        const { leftCoin, takeCoin } = await selectCoin(
          txBlock,
          scallopAddress,
          scallopUtils,
          coinName,
          amount,
          sender
        );
        txBlock.addCollateral(obligationArg, takeCoin, coinName);
        txBlock.transferObjects([leftCoin], sender);
      }
    },
  takeCollateralQuick:
    ({ txBlock, suiKit, scallopUtils, scallopAddress, isTestnet }) =>
    async (amount, coinName, obligationId, obligationKey) => {
      const { obligationId: obligationArg, obligationKey: obligationKeyArg } =
        await requireObligationInfo(
          txBlock,
          scallopAddress,
          suiKit,
          obligationId,
          obligationKey
        );

      await updateOraclesForWithdrawCollateral(
        txBlock,
        scallopAddress,
        scallopUtils,
        suiKit,
        obligationArg as string,
        isTestnet
      );
      return txBlock.takeCollateral(
        obligationArg,
        obligationKeyArg as SuiTxArg,
        amount,
        coinName
      );
    },
  depositQuick:
    ({ txBlock, scallopUtils, scallopAddress }) =>
    async (amount, coinName) => {
      const sender = requireSender(txBlock);
      if (coinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        return txBlock.deposit(suiCoin, coinName);
      } else {
        const { leftCoin, takeCoin } = await selectCoin(
          txBlock,
          scallopAddress,
          scallopUtils,
          coinName,
          amount,
          sender
        );
        txBlock.transferObjects([leftCoin], sender);
        return txBlock.deposit(takeCoin, coinName);
      }
    },
  withdrawQuick:
    ({ txBlock, scallopUtils, scallopAddress }) =>
    async (amount, coinName) => {
      const sender = requireSender(txBlock);
      const { leftCoin, takeCoin } = await selectMarketCoin(
        txBlock,
        scallopAddress,
        scallopUtils,
        coinName,
        amount,
        sender
      );
      txBlock.transferObjects([leftCoin], sender);
      return txBlock.withdraw(takeCoin, coinName);
    },
  borrowQuick:
    ({ txBlock, suiKit, scallopUtils, scallopAddress, isTestnet }) =>
    async (amount, coinName, obligationId, obligationKey) => {
      const { obligationId: obligationArg, obligationKey: obligationKeyArg } =
        await requireObligationInfo(
          txBlock,
          scallopAddress,
          suiKit,
          obligationId,
          obligationKey
        );

      await updateOraclesForBorrow(
        txBlock,
        scallopAddress,
        scallopUtils,
        suiKit,
        obligationArg as string,
        coinName,
        isTestnet
      );
      return txBlock.borrow(
        obligationArg,
        obligationKeyArg as SuiTxArg,
        amount,
        coinName
      );
    },
  repayQuick:
    ({ txBlock, suiKit, scallopUtils, scallopAddress }) =>
    async (amount, coinName, obligationId) => {
      const sender = requireSender(txBlock);
      const { obligationId: obligationArg } = await requireObligationInfo(
        txBlock,
        scallopAddress,
        suiKit,
        obligationId
      );

      if (coinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        return txBlock.repay(obligationArg, suiCoin, coinName);
      } else {
        const { leftCoin, takeCoin } = await selectCoin(
          txBlock,
          scallopAddress,
          scallopUtils,
          coinName,
          amount,
          sender
        );
        txBlock.transferObjects([leftCoin], sender);
        return txBlock.repay(obligationArg, takeCoin, coinName);
      }
    },
  updateAssetPricesQuick:
    ({ txBlock, scallopUtils, scallopAddress, isTestnet }) =>
    async (coinNames) => {
      return updateOracles(
        txBlock,
        scallopAddress,
        scallopUtils,
        coinNames,
        isTestnet
      );
    },
};

export const newScallopTxBlock = (
  suiKit: SuiKit,
  scallopAddress: ScallopAddress,
  scallopUtils: ScallopUtils,
  isTestnet: boolean
) => {
  const txBlock = newTxBlock(scallopAddress, scallopUtils);
  const txBlockProxy = new Proxy(txBlock, {
    get: (target, prop) => {
      if (prop in scallopQuickMethodsHandler) {
        return scallopQuickMethodsHandler[
          prop as keyof ScallopQuickMethodsHandler
        ]({
          txBlock: target,
          suiKit,
          scallopAddress,
          scallopUtils,
          isTestnet,
        });
      }
      return target[prop as keyof SuiTxBlock];
    },
  });
  return txBlockProxy as ScallopTxBlock;
};
