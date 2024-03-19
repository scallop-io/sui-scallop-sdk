import {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
  SuiObjectArg,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui.js/transactions';
import { ScallopBuilder } from 'src/models';

export type VescaIds = {
  pkgId: string;
  table: string;
  treasury: string;
  config: string;
};

export type VeScaNormalMethods = {
  lockSca: (scaCoin: SuiObjectArg, unlock_at: SuiTxArg) => void;
  extendLockPeriod: (veScaKey: SuiAddressArg, new_unlock_at: SuiTxArg) => void;
  lockMoreSca: (veScaKey: SuiAddressArg, scaCoin: SuiObjectArg) => void;
  renewExpiredVeSca: (
    veScaKey: SuiAddressArg,
    scaCoin: SuiObjectArg,
    new_unlock_at: SuiTxArg
  ) => void;
  withdrawSca: (veScaKey: SuiAddressArg) => TransactionResult;
};

export type VeScaQuickMethods = {
  lockScaQuick: (scaCoinAmount: number, unlock_at: number) => Promise<void>;
  extendLockPeriodQuick: (
    new_unlock_at: number,
    veScaKey?: SuiAddressArg
  ) => Promise<void>;
  lockMoreScaQuick: (
    scaCoinAmount: number,
    veScaKey?: SuiAddressArg
  ) => Promise<void>;
  renewExpiredVeScaQuick: (
    scaCoinAmount: number,
    new_unlock_at: number,
    veScaKey?: SuiAddressArg
  ) => void;
  withdrawScaQuick: (veScaKey?: SuiAddressArg) => Promise<TransactionResult>;
};

export type SuiTxBlockWithVeScaNormalMethods = SuiKitTxBlock &
  VeScaNormalMethods;

export type VeScaTxBlock = SuiTxBlockWithVeScaNormalMethods & VeScaQuickMethods;

export type GenerateVeScaNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => VeScaNormalMethods;
export type GenerateVeScaQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => VeScaQuickMethods;
