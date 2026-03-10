import { SuiObjectArg, SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models';

export type ObligationNamingIds = {
  pkgId: string;
  namingRegistry: string;
};

export type ObligationNamingNormalMethods = {
  setObligationName: (obligationKey: SuiObjectArg, name: string) => void;
  removeObligationName: (obligationKey: SuiObjectArg) => void;
};

export type ObligationNamingQuickMethods = {
  setObligationNameQuick: (
    obligationKeyId: string,
    name: string
  ) => Promise<void>;
  removeObligationNameQuick: (obligationKeyId: string) => Promise<void>;
};

export type SuiTxBlockWithObligationNamingNormalMethods = SuiKitTxBlock &
  ObligationNamingNormalMethods;
export type ObligationNamingTxBlock =
  SuiTxBlockWithObligationNamingNormalMethods & ObligationNamingQuickMethods;

export type GenerateObligationNamingNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => ObligationNamingNormalMethods;

export type GenerateObligationNamingQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithObligationNamingNormalMethods;
}) => ObligationNamingQuickMethods;
