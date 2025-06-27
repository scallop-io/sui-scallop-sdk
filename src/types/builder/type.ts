import type { CoreTxBlock, NestedResult } from './core';
import type { SpoolTxBlock } from './spool';
import type { BorrowIncentiveTxBlock } from './borrowIncentive';
import type { VeScaTxBlock } from './vesca';
import type { ReferralTxBlock } from './referral';
import type { LoyaltyProgramTxBlock } from './loyaltyProgram';
import type { SCoinTxBlock } from './sCoin';

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
