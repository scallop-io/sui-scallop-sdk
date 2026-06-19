import {
  SuiObjectArg,
  SuiTxBlock as SuiKitTxBlock,
  TransactionResult,
} from '@scallop-io/sui-kit';
import type { MoveCallContext } from 'src/builders/context.js';
import type { LoyaltyProgramActionContext } from 'src/builders/loyaltyProgram/quick.js';

export type LoyaltyProgramNormalMethods = {
  claimLoyaltyRevenue: (veScaKey: SuiObjectArg) => TransactionResult;
  claimVeScaLoyaltyReward: (veScaKey: SuiObjectArg) => TransactionResult;
};

export type LoyaltyProgramQuickMethods = {
  claimLoyaltyRevenueQuick: (veScaKey?: SuiObjectArg) => Promise<void>;
  claimVeScaLoyaltyRewardQuick: (veScaKey?: SuiObjectArg) => Promise<void>;
};

export type SuiTxBlockWithLoyaltyProgramNormalMethods = SuiKitTxBlock &
  LoyaltyProgramNormalMethods;
export type LoyaltyProgramTxBlock = SuiTxBlockWithLoyaltyProgramNormalMethods &
  LoyaltyProgramQuickMethods;

export type GenerateLoyaltyProgramNormalMethod = (params: {
  ctx: MoveCallContext;
  txBlock: SuiKitTxBlock;
}) => LoyaltyProgramNormalMethods;

export type GenerateLoyaltyProgramQuickMethod = (params: {
  ctx: LoyaltyProgramActionContext;
  txBlock: SuiTxBlockWithLoyaltyProgramNormalMethods;
}) => LoyaltyProgramQuickMethods;
