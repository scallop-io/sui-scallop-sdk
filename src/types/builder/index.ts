import type { CoreTxBlock, NestedResult } from './core';
import type { SpoolTxBlock } from './spool';
import type { BorrowIncentiveTxBlock } from './borrowIncentive';
import type { VeScaTxBlock } from './vesca';
import type { ReferralTxBlock } from './referral';
import { LoyaltyProgramTxBlock } from './loyaltyProgram';
import { SCoinTxBlock } from './sCoin';

export type * from './core';
export type * from './spool';
export type * from './borrowIncentive';
export type * from './vesca';
export type * from './loyaltyProgram';
export type * from './sCoin';

export type BaseScallopTxBlock = ReferralTxBlock &
  LoyaltyProgramTxBlock &
  BorrowIncentiveTxBlock &
  VeScaTxBlock;

export type SuiTxBlockWithSCoin = BaseScallopTxBlock & SCoinTxBlock;
export type SuiTxBlockWithSpool = SuiTxBlockWithSCoin & SpoolTxBlock;
export type ScallopTxBlock = SuiTxBlockWithSpool & CoreTxBlock;

export type SelectCoinReturnType<T extends string> = T extends 'sui'
  ? {
      takeCoin: NestedResult;
    }
  : {
      takeCoin: NestedResult;
      leftCoin: NestedResult;
    };
