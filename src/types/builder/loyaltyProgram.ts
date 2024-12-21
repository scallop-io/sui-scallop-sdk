import {
  SuiObjectArg,
  SuiTxBlock as SuiKitTxBlock,
  TransactionResult,
} from '@scallop-io/sui-kit';
import { type ScallopBuilder } from 'src/models';

export type LoyaltyProgramIds = {
  loyaltyProgramPkgId: string;
  rewardPool: string;
  userRewardTableId: string;
};

export type LoyaltyProgramNormalMethods = {
  claimLoyaltyRevenue: (veScaKey: SuiObjectArg) => Promise<TransactionResult>;
};

export type LoyaltyProgramQuickMethods = {
  claimLoyaltyRevenueQuick: (veScaKey?: SuiObjectArg) => Promise<void>;
};

export type SuiTxBlockWithLoyaltyProgramNormalMethods = SuiKitTxBlock &
  LoyaltyProgramNormalMethods;
export type LoyaltyProgramTxBlock = SuiTxBlockWithLoyaltyProgramNormalMethods &
  LoyaltyProgramQuickMethods;

export type GenerateLoyaltyProgramNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => LoyaltyProgramNormalMethods;

export type GenerateLoyaltyProgramQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithLoyaltyProgramNormalMethods;
}) => LoyaltyProgramQuickMethods;
