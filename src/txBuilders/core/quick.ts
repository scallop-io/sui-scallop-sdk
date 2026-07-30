import { requireSender } from '../../utils/builder.js';
import type {
  SuiObjectArg,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import type { GenerateCoreQuickMethod } from 'src/types/index.js';
import type { CoreActionContext } from '../context.js';

/**
 * Check and get Obligation information from transaction block.
 *
 * @description
 * If the obligation id is provided, directly return it.
 * If both obligation id and key is provided, directly return them.
 * Otherwise, automatically get obligation id and key from the sender.
 *
 * @param ctx - Core action context (provides `reads.getObligations`).
 * @param txBlock - TxBlock created by SuiKit.
 * @param obligationId - Obligation id.
 * @param obligationKey - Obligation key.
 * @return Obligation id and key.
 */
const requireObligationInfo = async (
  ...params: [
    ctx: CoreActionContext,
    txBlock: SuiKitTxBlock,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg,
  ]
) => {
  const [ctx, txBlock, obligationId, obligationKey] = params;
  if (params.length === 3 && obligationId) return { obligationId };
  if (params.length === 4 && obligationId && obligationKey)
    return { obligationId, obligationKey };
  const sender = requireSender(txBlock);
  const obligations = await ctx.reads.getObligations(sender);
  if (obligations.length === 0) {
    throw new Error(`No obligation found for sender ${sender}`);
  }
  return {
    obligationId: obligations[0].id,
    obligationKey: obligations[0].keyId,
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
 * @param ctx - Core action context (reads, coins, oracles, utils).
 * @param txBlock - TxBlock created by SuiKit.
 * @return Core quick methods.
 */
export const generateCoreQuickMethod: GenerateCoreQuickMethod = ({
  ctx,
  txBlock,
}) => {
  return {
    depositCollateralQuick: async (
      amount,
      collateralCoinName,
      obligationId,
      isSponsoredTx = false
    ) => {
      const sender = requireSender(txBlock);
      const { obligationId: obligationArg } = await requireObligationInfo(
        ctx,
        txBlock,
        obligationId
      );

      const { takeCoin } = await ctx.coins.selectCoin(
        txBlock,
        collateralCoinName,
        amount,
        sender,
        isSponsoredTx
      );

      txBlock.depositCollateral(obligationArg, takeCoin, collateralCoinName);
    },
    takeCollateralQuick: async (
      amount,
      collateralCoinName,
      obligationId,
      obligationKey,
      updateOracleOptions
    ) => {
      const obligationInfo = await requireObligationInfo(
        ctx,
        txBlock,
        obligationId,
        obligationKey
      );
      const updateCoinNames = await ctx.reads.getObligationCoinNames(
        obligationInfo.obligationId
      );
      await ctx.oracles.updateOracles(
        txBlock,
        updateCoinNames,
        updateOracleOptions
      );
      return txBlock.takeCollateral(
        obligationInfo.obligationId,
        obligationInfo.obligationKey as SuiObjectArg,
        amount,
        collateralCoinName
      );
    },
    supplyQuick: async (
      amount,
      poolCoinName,
      returnSCoin = true,
      isSponsoredTx = false
    ) => {
      const sender = requireSender(txBlock);
      const { takeCoin } = await ctx.coins.selectCoin(
        txBlock,
        poolCoinName,
        amount,
        sender,
        isSponsoredTx
      );
      const marketCoinDeposit = txBlock.supply(takeCoin, poolCoinName);

      // convert to sCoin
      return returnSCoin
        ? txBlock.mintSCoin(
            ctx.utils.parseMarketCoinName(poolCoinName),
            marketCoinDeposit
          )
        : marketCoinDeposit;
    },
    withdrawQuick: async (amount, poolCoinName) => {
      const sender = requireSender(txBlock);
      const sCoinName = ctx.utils.parseSCoinName(poolCoinName);
      if (!sCoinName) throw new Error(`No sCoin for ${poolCoinName}`);

      // eslint-disable-next-line prefer-const
      let { sCoin, marketCoin } = await ctx.coins.selectSCoinOrMarketCoin(
        txBlock,
        sCoinName,
        amount,
        sender
      );

      if (sCoin) {
        const newMarketCoin = txBlock.burnSCoin(sCoinName, sCoin);
        if (marketCoin) {
          txBlock.mergeCoins(marketCoin, [newMarketCoin]);
        } else {
          marketCoin = newMarketCoin;
        }
      }

      if (!marketCoin) throw new Error(`No market coin for ${poolCoinName}`);
      return txBlock.withdraw(marketCoin, poolCoinName);
    },
    borrowQuick: async (
      amount,
      poolCoinName,
      obligationId,
      obligationKey,
      updateOracleOptions
    ) => {
      const obligationInfo = await requireObligationInfo(
        ctx,
        txBlock,
        obligationId,
        obligationKey
      );
      const obligationCoinNames =
        (await ctx.reads.getObligationCoinNames(obligationInfo.obligationId)) ??
        [];
      const updateCoinNames = [...obligationCoinNames, poolCoinName];
      await ctx.oracles.updateOracles(
        txBlock,
        updateCoinNames,
        updateOracleOptions
      );
      return txBlock.borrow(
        obligationInfo.obligationId,
        obligationInfo.obligationKey as SuiObjectArg,
        amount,
        poolCoinName
      );
    },
    borrowWithReferralQuick: async (
      amount,
      poolCoinName,
      borrowReferral,
      obligationId,
      obligationKey,
      updateOracleOptions
    ) => {
      const obligationInfo = await requireObligationInfo(
        ctx,
        txBlock,
        obligationId,
        obligationKey
      );
      const obligationCoinNames =
        (await ctx.reads.getObligationCoinNames(obligationInfo.obligationId)) ??
        [];
      const updateCoinNames = [...obligationCoinNames, poolCoinName];
      await ctx.oracles.updateOracles(
        txBlock,
        updateCoinNames,
        updateOracleOptions
      );
      return txBlock.borrowWithReferral(
        obligationInfo.obligationId,
        obligationInfo.obligationKey as SuiObjectArg,
        borrowReferral,
        amount,
        poolCoinName
      );
    },
    repayQuick: async (
      amount,
      poolCoinName,
      obligationId,
      isSponsoredTx = false
    ) => {
      const sender = requireSender(txBlock);
      const obligationInfo = await requireObligationInfo(
        ctx,
        txBlock,
        obligationId
      );

      const { takeCoin } = await ctx.coins.selectCoin(
        txBlock,
        poolCoinName,
        amount,
        sender,
        isSponsoredTx
      );
      return txBlock.repay(obligationInfo.obligationId, takeCoin, poolCoinName);
    },
    // @TODO: Temporary code, will be removed once those unsupported price feeds
    // are supported in the new Pyth Core.
    legacyUpdateAssetPricesQuick: async (
      assetCoinNames,
      updateOracleOptions
    ) => {
      return await ctx.oracles.legacyUpdateOracles(
        txBlock,
        assetCoinNames,
        updateOracleOptions
      );
    },
    updateAssetPricesQuick: async (assetCoinNames, updateOracleOptions) => {
      return await ctx.oracles.updateOracles(
        txBlock,
        assetCoinNames,
        updateOracleOptions
      );
    },
    liquidateQuick: async (
      amount,
      debtCoinName,
      collateralCoinName,
      obligationId,
      updateOracleOptions
    ) => {
      const sender = requireSender(txBlock);

      // Update oracle prices for debt and collateral coins
      const updateCoinNames =
        await ctx.reads.getObligationCoinNames(obligationId);

      await ctx.oracles.updateOracles(
        txBlock,
        updateCoinNames,
        updateOracleOptions
      );

      // Select coins for liquidation
      const { takeCoin } = await ctx.coins.selectCoin(
        txBlock,
        debtCoinName,
        amount,
        sender,
        updateOracleOptions?.isSponsoredTx ?? false
      );

      // Convert obligation to SharedObjectRef format
      const obligationSharedObject =
        typeof obligationId === 'string'
          ? txBlock.object(obligationId)
          : obligationId;

      // Execute liquidation
      return txBlock.liquidate(
        obligationSharedObject,
        takeCoin,
        debtCoinName,
        collateralCoinName
      );
    },
  };
};
