import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { getObligations } from '../queries';
import { updateOracles } from './oracle';
import { requireSender } from '../utils';
import type { SuiObjectArg, TransactionResult } from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../models';
import type {
  CoreIds,
  GenerateCoreNormalMethod,
  GenerateCoreQuickMethod,
  SuiTxBlockWithCoreNormalMethods,
  CoreTxBlock,
  ScallopTxBlock,
  NestedResult,
  SuiTxBlockWithSpool,
} from '../types';

/**
 * Check and get Obligation information from transaction block.
 *
 * @description
 * If the obligation id is provided, directly return it.
 * If both obligation id and key is provided, directly return them.
 * Otherwise, automatically get obligation id and key from the sender.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @param obligationId - Obligation id.
 * @param obligationKey - Obligation key.
 * @return Obligation id and key.
 */
const requireObligationInfo = async (
  ...params: [
    builder: ScallopBuilder,
    txBlock: SuiKitTxBlock,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg,
  ]
) => {
  const [builder, txBlock, obligationId, obligationKey] = params;
  // if (params.length === 3 && obligationId) return { obligationId };
  if (params.length === 4 && obligationId && obligationKey)
    return { obligationId, obligationKey };
  const sender = requireSender(txBlock);
  const obligations = await getObligations(builder, sender);
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
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
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

  const referralPkgId = builder.address.get('referral.id');
  const referralWitnessType = `${referralPkgId}::scallop_referral_program::REFERRAL_WITNESS`;
  const clockObjectRef = txBlock.sharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    mutable: false,
    initialSharedVersion: '1',
  });

  return {
    openObligation: () => {
      const [obligation, obligationKey, obligationHotPotato] = builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::open_obligation::open_obligation`,
        [coreIds.version]
      );
      return [obligation, obligationKey, obligationHotPotato] as [
        NestedResult,
        NestedResult,
        NestedResult,
      ];
    },
    returnObligation: (obligation, obligationHotPotato) => {
      builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::open_obligation::return_obligation`,
        [coreIds.version, obligation, obligationHotPotato]
      );
    },
    openObligationEntry: () => {
      builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::open_obligation::open_obligation_entry`,
        [coreIds.version]
      );
    },
    addCollateral: (obligation, coin, collateralCoinName) => {
      const coinType = builder.utils.parseCoinType(collateralCoinName);
      builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::deposit_collateral::deposit_collateral`,
        [coreIds.version, obligation, coreIds.market, coin],
        [coinType]
      );
    },
    takeCollateral: (obligation, obligationKey, amount, collateralCoinName) => {
      const coinType = builder.utils.parseCoinType(collateralCoinName);
      // return await builder.moveCall(
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::withdraw_collateral::withdraw_collateral`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.coinDecimalsRegistry,
          txBlock.pure.u64(amount),
          coreIds.xOracle,
          clockObjectRef,
        ],
        [coinType]
      );
    },
    deposit: (coin, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      // return await builder.moveCall(
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::mint::mint`,
        [coreIds.version, coreIds.market, coin, clockObjectRef],
        [coinType]
      );
    },
    depositEntry: (coin, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      // return await builder.moveCall(
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::mint::mint_entry`,
        [coreIds.version, coreIds.market, coin, clockObjectRef],
        [coinType]
      );
    },
    withdraw: (marketCoin, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      // return await builder.moveCall(
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::redeem::redeem`,
        [coreIds.version, coreIds.market, marketCoin, clockObjectRef],
        [coinType]
      );
    },
    withdrawEntry: (marketCoin, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      // return await builder.moveCall(
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::redeem::redeem_entry`,
        [coreIds.version, coreIds.market, marketCoin, clockObjectRef],
        [coinType]
      );
    },
    borrow: (obligation, obligationKey, amount, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      // return await builder.moveCall(
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::borrow::borrow`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.coinDecimalsRegistry,
          amount,
          coreIds.xOracle,
          clockObjectRef,
        ],
        [coinType]
      );
    },
    borrowWithReferral: (
      obligation,
      obligationKey,
      borrowReferral,
      amount,
      poolCoinName
    ) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      // return await builder.moveCall(
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::borrow::borrow_with_referral`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.coinDecimalsRegistry,
          borrowReferral,
          typeof amount === 'number' ? txBlock.pure.u64(amount) : amount,
          coreIds.xOracle,
          clockObjectRef,
        ],
        [coinType, referralWitnessType]
      );
    },
    borrowEntry: (obligation, obligationKey, amount, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      // return await builder.moveCall(
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::borrow::borrow_entry`,
        [
          coreIds.version,
          obligation,
          obligationKey,
          coreIds.market,
          coreIds.coinDecimalsRegistry,
          txBlock.pure.u64(amount),
          coreIds.xOracle,
          clockObjectRef,
        ],
        [coinType]
      );
    },
    repay: (obligation, coin, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::repay::repay`,
        [coreIds.version, obligation, coreIds.market, coin, clockObjectRef],
        [coinType]
      );
    },
    borrowFlashLoan: (amount, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return builder.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::flash_loan::borrow_flash_loan`,
        [coreIds.version, coreIds.market, amount],
        [coinType]
      );
    },
    repayFlashLoan: (coin, loan, poolCoinName) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      builder.moveCall(
        txBlock,
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
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @return Core quick methods.
 */
const generateCoreQuickMethod: GenerateCoreQuickMethod = ({
  builder,
  txBlock,
}) => {
  return {
    addCollateralQuick: async (amount, collateralCoinName, obligationId) => {
      const sender = requireSender(txBlock);
      const { obligationId: obligationArg } = await requireObligationInfo(
        builder,
        txBlock,
        obligationId
      );

      if (collateralCoinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        txBlock.addCollateral(obligationArg, suiCoin, collateralCoinName);
      } else {
        const { leftCoin, takeCoin } = await builder.selectCoin(
          txBlock,
          collateralCoinName,
          amount,
          sender
        );
        txBlock.addCollateral(obligationArg, takeCoin, collateralCoinName);
        txBlock.transferObjects([leftCoin], sender);
      }
    },
    takeCollateralQuick: async (
      amount,
      collateralCoinName,
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
        obligationInfo.obligationId
      );
      await updateOracles(builder, txBlock, updateCoinNames);
      return txBlock.takeCollateral(
        obligationInfo.obligationId,
        obligationInfo.obligationKey as SuiObjectArg,
        amount,
        collateralCoinName
      );
    },
    depositQuick: async (amount, poolCoinName, returnSCoin = true) => {
      const sender = requireSender(txBlock);
      let marketCoinDeposit: TransactionResult | undefined;
      if (poolCoinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        marketCoinDeposit = txBlock.deposit(suiCoin, poolCoinName);
      } else {
        const { leftCoin, takeCoin } = await builder.selectCoin(
          txBlock,
          poolCoinName,
          amount,
          sender
        );
        txBlock.transferObjects([leftCoin], sender);
        marketCoinDeposit = txBlock.deposit(takeCoin, poolCoinName);
      }

      // convert to sCoin
      return returnSCoin
        ? txBlock.mintSCoin(
            builder.utils.parseMarketCoinName(poolCoinName),
            marketCoinDeposit
          )
        : marketCoinDeposit;
    },
    withdrawQuick: async (amount, poolCoinName) => {
      const sender = requireSender(txBlock);
      const marketCoinName = builder.utils.parseMarketCoinName(poolCoinName);

      // check if user has sCoin instead of marketCoin
      try {
        const sCoinName = builder.utils.parseSCoinName(poolCoinName);
        if (!sCoinName) throw new Error(`No sCoin for ${poolCoinName}`);
        const {
          leftCoin,
          takeCoin: sCoins,
          totalAmount,
        } = await builder.selectSCoin(txBlock, sCoinName, amount, sender);
        txBlock.transferObjects([leftCoin], sender);
        const marketCoins = txBlock.burnSCoin(sCoinName, sCoins);

        // check amount
        amount -= totalAmount;
        try {
          if (amount > 0) {
            // sCoin is not enough, try market coin
            const { leftCoin, takeCoin: walletMarketCoins } =
              await builder.selectMarketCoin(
                txBlock,
                marketCoinName,
                amount,
                sender
              );
            txBlock.transferObjects([leftCoin], sender);
            txBlock.mergeCoins(marketCoins, [walletMarketCoins]);
          }
        } catch (_e) {
          // ignore
        }
        return txBlock.withdraw(marketCoins, poolCoinName);
      } catch (_e) {
        // no sCoin found
        const { leftCoin, takeCoin: walletMarketCoins } =
          await builder.selectMarketCoin(
            txBlock,
            marketCoinName,
            amount,
            sender
          );
        txBlock.transferObjects([leftCoin], sender);
        return txBlock.withdraw(walletMarketCoins, poolCoinName);
      }
    },
    borrowQuick: async (amount, poolCoinName, obligationId, obligationKey) => {
      const obligationInfo = await requireObligationInfo(
        builder,
        txBlock,
        obligationId,
        obligationKey
      );
      const obligationCoinNames =
        (await builder.utils.getObligationCoinNames(
          obligationInfo.obligationId
        )) ?? [];
      const updateCoinNames = [...obligationCoinNames, poolCoinName];
      await updateOracles(builder, txBlock, updateCoinNames);
      return txBlock.borrow(
        obligationInfo.obligationId,
        obligationInfo.obligationKey,
        amount,
        poolCoinName
      );
    },
    borrowWithReferralQuick: async (
      amount,
      poolCoinName,
      borrowReferral,
      obligationId,
      obligationKey
    ) => {
      const obligationInfo = await requireObligationInfo(
        builder,
        txBlock,
        obligationId,
        obligationKey
      );
      const obligationCoinNames =
        (await builder.utils.getObligationCoinNames(
          obligationInfo.obligationId
        )) ?? [];
      const updateCoinNames = [...obligationCoinNames, poolCoinName];
      await updateOracles(builder, txBlock, updateCoinNames);
      return txBlock.borrowWithReferral(
        obligationInfo.obligationId,
        obligationInfo.obligationKey,
        borrowReferral,
        amount,
        poolCoinName
      );
    },
    repayQuick: async (amount, poolCoinName, obligationId) => {
      const sender = requireSender(txBlock);
      const obligationInfo = await requireObligationInfo(
        builder,
        txBlock,
        obligationId
      );

      if (poolCoinName === 'sui') {
        const [suiCoin] = txBlock.splitSUIFromGas([amount]);
        return txBlock.repay(
          obligationInfo.obligationId,
          suiCoin,
          poolCoinName
        );
      } else {
        const { leftCoin, takeCoin } = await builder.selectCoin(
          txBlock,
          poolCoinName,
          amount,
          sender
        );
        txBlock.transferObjects([leftCoin], sender);
        return txBlock.repay(
          obligationInfo.obligationId,
          takeCoin,
          poolCoinName
        );
      }
    },
    updateAssetPricesQuick: async (assetCoinNames) => {
      return await updateOracles(builder, txBlock, assetCoinNames);
    },
  };
};

/**
 * Create an enhanced transaction block instance for interaction with core modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop core txBlock.
 */
export const newCoreTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?:
    | ScallopTxBlock
    | SuiKitTxBlock
    | Transaction
    | SuiTxBlockWithSpool
) => {
  const txBlock =
    initTxBlock instanceof Transaction
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
