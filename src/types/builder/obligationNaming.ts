import { SuiTxBlock as SuiKitTxBlock, SuiObjectArg } from '@scallop-io/sui-kit';
import { MoveCallContext } from 'src/txBuilders/context.js';

export type ObligationNamingNormalMethods = {
  setObligationName: (obligationKey: SuiObjectArg, name: string) => void;
  removeObligationName: (obligationKey: SuiObjectArg) => void;
};

export type GenerateObligationNamingNormalMethod = (params: {
  ctx: MoveCallContext;
  txBlock: SuiKitTxBlock;
}) => ObligationNamingNormalMethods;

export type SuiTxBlockWithObligationNamingNormalMethods = SuiKitTxBlock &
  ObligationNamingNormalMethods;

export type ObligationNamingTxBlock =
  SuiTxBlockWithObligationNamingNormalMethods;
