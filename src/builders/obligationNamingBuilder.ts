import { ScallopBuilder } from 'src/models';
import { ScallopTxBlock } from 'src/types';
import {
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
  Transaction,
} from '@scallop-io/sui-kit';
import {
  GenerateObligationNamingNormalMethod,
  GenerateObligationNamingQuickMethod,
  ObligationNamingIds,
  ObligationNamingTxBlock,
  SuiTxBlockWithObligationNamingNormalMethods,
} from 'src/types/builder/obligationNaming';

const generateObligationNamingNormalMethod: GenerateObligationNamingNormalMethod =
  ({ builder, txBlock }) => {
    const obligationNamingIds: ObligationNamingIds = {
      pkgId: builder.address.get('obligationNaming.id'),
      namingRegistry: builder.address.get('obligationNaming.namingRegistry'),
    };

    return {
      setObligationName: (obligationKey: SuiObjectArg, name: string) => {
        builder.moveCall(
          txBlock,
          `${obligationNamingIds.pkgId}::obligation_naming::set_name`,
          [
            obligationNamingIds.namingRegistry,
            obligationKey,
            txBlock.pure.string(name),
          ],
          []
        );
      },
      removeObligationName: (obligationKey: SuiObjectArg) => {
        builder.moveCall(
          txBlock,
          `${obligationNamingIds.pkgId}::obligation_naming::remove_name`,
          [obligationNamingIds.namingRegistry, obligationKey],
          []
        );
      },
    };
  };

const generateObligationNamingQuickMethod: GenerateObligationNamingQuickMethod =
  ({ txBlock }) => {
    return {
      setObligationNameQuick: async (obligationKeyId: string, name: string) => {
        txBlock.setObligationName(obligationKeyId, name);
      },
      removeObligationNameQuick: async (obligationKeyId: string) => {
        txBlock.removeObligationName(obligationKeyId);
      },
    };
  };

/**
 * Create an enhanced transaction block instance for interaction with obligation naming modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop obligation naming txBlock.
 */
export const newObligationNamingTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
        ? initTxBlock
        : new SuiKitTxBlock();

  const normalMethod = generateObligationNamingNormalMethod({
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
  }) as SuiTxBlockWithObligationNamingNormalMethods;

  const quickMethod = generateObligationNamingQuickMethod({
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
  }) as ObligationNamingTxBlock;
};
