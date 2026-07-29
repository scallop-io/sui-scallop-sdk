import { SuiObjectArg } from '@scallop-io/sui-kit';
import { GenerateObligationNamingNormalMethod } from 'src/types/index.js';

export const generateObligationNamingNormalMethod: GenerateObligationNamingNormalMethod =
  ({ ctx, txBlock }) => {
    const obligationNamingIds = {
      pkgId: ctx.address.get('obligationNaming.id'),
      namingRegistry: ctx.address.get('obligationNaming.namingRegistry'),
    };

    return {
      setObligationName: (obligationKey: SuiObjectArg, name: string) => {
        ctx.moveCall(
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
        ctx.moveCall(
          txBlock,
          `${obligationNamingIds.pkgId}::obligation_naming::remove_name`,
          [obligationNamingIds.namingRegistry, obligationKey],
          []
        );
      },
    };
  };
