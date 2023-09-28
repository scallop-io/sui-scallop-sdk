import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { getObligations } from '../queries';
import { updateOracles } from './oracle';
import type { SuiTxArg } from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../models';
import type {
  CoreIds,
  GenerateCoreNormalMethod,
  GenerateCoreQuickMethod,
  SuiTxBlockWithCoreNormalMethods,
  CoreTxBlock,
  ScallopTxBlock,
} from '../types';

/**
 * Check and get the sender from the transaction block.
 *
 * @param txBlock - txBlock created by SuiKit.
 * @return Sender of transaction.
 */
const requireSender = (txBlock: SuiKitTxBlock) => {
  const sender = txBlock.blockData.sender;
  if (!sender) {
    throw new Error('Sender is required');
  }
  return sender;
};

/**
 * Check and get Obligation information from transaction block.
 *
 * @description
 * If the obligation id is provided, direactly return it.
 * If both obligation id and key is provided, direactly return them.
 * Otherwise, automatically get obligation id and key from the sender.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - txBlock created by SuiKit.
 * @param obligationId - Obligation id.
 * @param obligationKey - Obligation key.
 * @return Obligation id and key.
 */
const requireObligationInfo = async (
  ...params: [
    builder: ScallopBuilder,
    txBlock: SuiKitTxBlock,
    obligationId?: SuiTxArg | undefined,
    obligationKey?: SuiTxArg | undefined,
  ]
) => {
  const [builder, txBlock, obligationId, obligationKey] = params;
  if (params.length === 3 && obligationId) return { obligationId };
  if (params.length === 4 && obligationId && obligationKey)
    return { obligationId, obligationKey };
  const sender = requireSender(txBlock);
  const obligations = await getObligations(builder.query, sender);
  if (obligations.length === 0) {
    throw new Error(`No obligation found for sender ${sender}`);
  }
  return {
    obligationId: obligations[0].id,
    obligationKey: obligations[0].keyId,
  };
};

/**
 * Generate core normal methods.
 *
 * @param builder Scallop builder instance.
 * @param txBlock TxBlock created by SuiKit.
 * @return Core normal methods.
 */
const generateCoreNormalMethod: GenerateCoreNormalMethod = ({
  builder,
  txBlock,
}) => {
  const coreIds: CoreIds = {
    protocolPkg: builder.address.get('core.packages.protocol.id'),
    market: builder.address.get('core.market'),
    version: builder.address.get('core.version'),
    coinDecimalsRegistry: builder.address.get('core.coinDecimalsRegistry'),
    xOracle: builder.address.get('core.oracles.xOracle'),
  };
  return {
    openObligation: () =>
      txBlock.moveCall(
        `${coreIds.protocolPkg}::open_obligation::open_obligation`,
        [coreIds.version]
      ),
    returnObligation: (obligation, obligationHotPotato) =>
      txBlock.moveCall(
        `${coreIds.protocolPkg}::open_obligation::return_obligation`,
        [coreIds.version, obligation, obligationHotPotato]
      ),
    openObligationEntry: () =>
      txBlock.moveCall(
        `${coreIds.protocolPkg}::open_obligation::open_obligation_entry`,
        [coreIds.version]
      ),
    addCollateral: (obligation, coin, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::deposit_collateral::deposit_collateral`,
        [coreIds.version, obligation, coreIds.market, coin],
        [coinType]
      );
    },
    takeCollateral: (obligation, obligationKey, amount, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::withdraw_collateral::withdraw_collateral`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.coinDecimalsRegistry,
          amount,
          coreIds.xOracle,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
    deposit: (coin, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::mint::mint`,
        [coreIds.version, coreIds.market, coin, SUI_CLOCK_OBJECT_ID],
        [coinType]
      );
    },
    depositEntry: (coin, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::mint::mint_entry`,
        [coreIds.version, coreIds.market, coin, SUI_CLOCK_OBJECT_ID],
        [coinType]
      );
    },
    withdraw: (marketCoin, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::redeem::redeem`,
        [coreIds.version, coreIds.market, marketCoin, SUI_CLOCK_OBJECT_ID],
        [coinType]
      );
    },
    withdrawEntry: (marketCoin, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::redeem::redeem_entry`,
        [coreIds.version, coreIds.market, marketCoin, SUI_CLOCK_OBJECT_ID],
        [coinType]
      );
    },
    borrow: (obligation, obligationKey, amount, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::borrow::borrow`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.coinDecimalsRegistry,
          amount,
          coreIds.xOracle,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
    borrowEntry: (obligation, obligationKey, amount, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::borrow::borrow_entry`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.coinDecimalsRegistry,
          amount,
          coreIds.xOracle,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
    repay: (obligation, coin, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
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
    borrowFlashLoan: (amount, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::flash_loan::borrow_flash_loan`,
        [coreIds.version, coreIds.market, amount],
        [coinType]
      );
    },
    repayFlashLoan: (coin, loan, coinName) => {
      const coinType = builder.utils.parseCoinType(coinName);
      return txBlock.moveCall(
        `${coreIds.protocolPkg}::flash_loan::repay_flash_loan`,
        [coreIds.version, coreIds.market, coin, loan],
        [coinType]
      );
    },
  };
};

/**
 * Generate core quick methods.
 *
 * @description
 * The quick methods are the same as the normal methods, but they will automatically
 * help users organize transaction blocks, include query obligation info, and transfer
 * coins to the sender. So, they are all asynchronous methods.
 *
 * @param builder Scallop builder instance.
 * @param txBlock TxBlock created by SuiKit.
 * @return Core quick methods.
 */
const generateCoreQuickMethod: GenerateCoreQuickMethod = ({
  builder,
  txBlock,
}) => {
  return {
    addCollateralQuick: async (amount, coinName, obligationId) => {
      const sender = requireSender(txBlock);
      const { obligationId: obligationArg } = await requireObligationInfo(
        builder,
        txBlock,
        obligationId
      );

      if (coinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        txBlock.addCollateral(obligationArg, suiCoin, coinName);
      } else {
        const { leftCoin, takeCoin } = await builder.selectCoin(
          txBlock,
          coinName,
          amount,
          sender
        );
        txBlock.addCollateral(obligationArg, takeCoin, coinName);
        txBlock.transferObjects([leftCoin], sender);
      }
    },
    takeCollateralQuick: async (
      amount,
      coinName,
      obligationId,
      obligationKey
    ) => {
      const obligationInfo = await requireObligationInfo(
        builder,
        txBlock,
        obligationId,
        obligationKey
      );
      const updateCoinNames = await builder.utils.getObligationCoinNames(
        obligationInfo.obligationId as string
      );
      await updateOracles(builder, txBlock, updateCoinNames);
      return txBlock.takeCollateral(
        obligationInfo.obligationId,
        obligationInfo.obligationKey as SuiTxArg,
        amount,
        coinName
      );
    },
    depositQuick: async (amount, coinName) => {
      const sender = requireSender(txBlock);
      if (coinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        return txBlock.deposit(suiCoin, coinName);
      } else {
        const { leftCoin, takeCoin } = await builder.selectCoin(
          txBlock,
          coinName,
          amount,
          sender
        );
        txBlock.transferObjects([leftCoin], sender);
        return txBlock.deposit(takeCoin, coinName);
      }
    },
    withdrawQuick: async (amount, coinName) => {
      const sender = requireSender(txBlock);
      const { leftCoin, takeCoin } = await builder.selectMarketCoin(
        txBlock,
        coinName,
        amount,
        sender
      );
      txBlock.transferObjects([leftCoin], sender);
      return txBlock.withdraw(takeCoin, coinName);
    },
    borrowQuick: async (amount, coinName, obligationId, obligationKey) => {
      const obligationInfo = await requireObligationInfo(
        builder,
        txBlock,
        obligationId,
        obligationKey
      );
      const obligationCoinNames = await builder.utils.getObligationCoinNames(
        obligationInfo.obligationId as string
      );
      const updateCoinNames = [...obligationCoinNames, coinName];
      await updateOracles(builder, txBlock, updateCoinNames);
      return txBlock.borrow(
        obligationInfo.obligationId,
        obligationInfo.obligationKey as SuiTxArg,
        amount,
        coinName
      );
    },
    repayQuick: async (amount, coinName, obligationId) => {
      const sender = requireSender(txBlock);
      const obligationInfo = await requireObligationInfo(
        builder,
        txBlock,
        obligationId
      );

      if (coinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        return txBlock.repay(obligationInfo.obligationId, suiCoin, coinName);
      } else {
        const { leftCoin, takeCoin } = await builder.selectCoin(
          txBlock,
          coinName,
          amount,
          sender
        );
        txBlock.transferObjects([leftCoin], sender);
        return txBlock.repay(obligationInfo.obligationId, takeCoin, coinName);
      }
    },
    updateAssetPricesQuick: async (coinNames) => {
      return updateOracles(builder, txBlock, coinNames);
    },
  };
};

/**
 * Create an enhanced transaction block instance for interaction with core modules of the Scallop contract.
 *
 * @param builder Scallop builder instance.
 * @param initTxBlock Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop core txBlock.
 */
export const newCoreTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
) => {
  const txBlock =
    initTxBlock instanceof TransactionBlock
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
      ? initTxBlock
      : new SuiKitTxBlock();

  const normalMethod = generateCoreNormalMethod({
    builder,
    txBlock,
  });

  const normalTxBlock = new Proxy(txBlock, {
    get: (target, prop) => {
      if (prop in normalMethod) {
        return Reflect.get(normalMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as SuiTxBlockWithCoreNormalMethods;

  const quickMethod = generateCoreQuickMethod({
    builder,
    txBlock: normalTxBlock,
  });

  return new Proxy(normalTxBlock, {
    get: (target, prop) => {
      if (prop in quickMethod) {
        return Reflect.get(quickMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as CoreTxBlock;
};
