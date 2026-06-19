import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import type {
  CoreIds,
  GenerateCoreNormalMethod,
  NestedResult,
} from 'src/types/index.js';

/**
 * Generate core normal methods.
 *
 * @param ctx - Pure Move-call context (address reads, coin-type parsing, moveCall).
 * @param txBlock - TxBlock created by SuiKit.
 * @return Core normal methods.
 */
export const generateCoreNormalMethod: GenerateCoreNormalMethod = ({
  ctx,
  txBlock,
}) => {
  const coreIds: CoreIds = {
    protocolPkg: ctx.address.get('core.packages.protocol.id'),
    market: ctx.address.get('core.market'),
    version: ctx.address.get('core.version'),
    coinDecimalsRegistry: ctx.address.get('core.coinDecimalsRegistry'),
    xOracle: ctx.address.get('core.oracles.xOracle'),
  };

  const referralPkgId = ctx.address.get('referral.id');
  const referralWitnessType = `${referralPkgId}::scallop_referral_program::REFERRAL_WITNESS`;
  const clockObjectRef = txBlock.sharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    mutable: false,
    initialSharedVersion: '1',
  });

  return {
    openObligation: () => {
      const [obligation, obligationKey, obligationHotPotato] = ctx.moveCall(
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
      ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::open_obligation::return_obligation`,
        [coreIds.version, obligation, obligationHotPotato]
      );
    },
    openObligationEntry: () => {
      ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::open_obligation::open_obligation_entry`,
        [coreIds.version]
      );
    },
    depositCollateral: (obligation, coin, collateralCoinName) => {
      const coinType = ctx.utils.parseCoinType(collateralCoinName);
      ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::deposit_collateral::deposit_collateral`,
        [coreIds.version, obligation, coreIds.market, coin],
        [coinType]
      );
    },
    takeCollateral: (obligation, obligationKey, amount, collateralCoinName) => {
      const coinType = ctx.utils.parseCoinType(collateralCoinName);
      // return await ctx.moveCall(
      return ctx.moveCall(
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
    supply: (coin, poolCoinName) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      return ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::mint::mint`,
        [coreIds.version, coreIds.market, coin, clockObjectRef],
        [coinType]
      );
    },
    depositEntry: (coin, poolCoinName) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      // return await ctx.moveCall(
      return ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::mint::mint_entry`,
        [coreIds.version, coreIds.market, coin, clockObjectRef],
        [coinType]
      );
    },
    withdraw: (marketCoin, poolCoinName) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      // return await ctx.moveCall(
      return ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::redeem::redeem`,
        [coreIds.version, coreIds.market, marketCoin, clockObjectRef],
        [coinType]
      );
    },
    withdrawEntry: (marketCoin, poolCoinName) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      // return await ctx.moveCall(
      return ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::redeem::redeem_entry`,
        [coreIds.version, coreIds.market, marketCoin, clockObjectRef],
        [coinType]
      );
    },
    borrow: (obligation, obligationKey, amount, poolCoinName) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      // return await ctx.moveCall(
      return ctx.moveCall(
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
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      // return await ctx.moveCall(
      return ctx.moveCall(
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
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      // return await ctx.moveCall(
      return ctx.moveCall(
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
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::repay::repay`,
        [coreIds.version, obligation, coreIds.market, coin, clockObjectRef],
        [coinType]
      );
    },
    borrowFlashLoan: (amount, poolCoinName) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      return ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::flash_loan::borrow_flash_loan`,
        [coreIds.version, coreIds.market, amount],
        [coinType]
      );
    },
    repayFlashLoan: (coin, loan, poolCoinName) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::flash_loan::repay_flash_loan`,
        [coreIds.version, coreIds.market, coin, loan],
        [coinType]
      );
    },
    liquidate: (obligation, coin, debtCoinName, collateralCoinName) => {
      const debtCoinType = ctx.utils.parseCoinType(debtCoinName);
      const collateralCoinType = ctx.utils.parseCoinType(collateralCoinName);
      const [debtCoin, collateralCoin] = ctx.moveCall(
        txBlock,
        `${coreIds.protocolPkg}::liquidate::liquidate`,
        [
          coreIds.version,
          obligation,
          coreIds.market,
          coin,
          coreIds.coinDecimalsRegistry,
          coreIds.xOracle,
          clockObjectRef,
        ],
        [debtCoinType, collateralCoinType]
      );

      return [debtCoin, collateralCoin] as [NestedResult, NestedResult];
    },
  };
};
