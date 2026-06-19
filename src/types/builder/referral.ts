import {
  SuiObjectArg,
  TransactionResult,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import type { MoveCallContext } from 'src/builders/context.js';
import type { ReferralActionContext } from 'src/builders/referral/quick.js';

export type ReferralIds = {
  referralPgkId: string;
  referralBindings: string;
  referralRevenuePool: string;
  referralTiers: string;
  authorizedWitnessList: string;
  version: string;
};

export type ReferralNormalMethods = {
  bindToReferral: (veScaKeyId: string) => void;
  claimReferralTicket: (poolCoinName: string) => TransactionResult;
  burnReferralTicket: (ticket: SuiObjectArg, poolCoinName: string) => void;
  claimReferralRevenue: (
    veScaKey: SuiObjectArg,
    poolCoinName: string
  ) => TransactionResult;
  unbindReferral: () => void;
};

export type ReferralQuickMethods = {
  claimReferralRevenueQuick: (
    veScaKey: SuiObjectArg,
    coinNames: string[]
  ) => Promise<void>;
};

export type SuiTxBlockWithReferralNormalMethods = SuiKitTxBlock &
  ReferralNormalMethods;
export type ReferralTxBlock = SuiTxBlockWithReferralNormalMethods &
  ReferralQuickMethods;

export type GenerateReferralNormalMethod = (params: {
  ctx: MoveCallContext;
  txBlock: SuiKitTxBlock;
}) => ReferralNormalMethods;

export type GenerateReferralQuickMethod = (params: {
  ctx: ReferralActionContext;
  txBlock: SuiTxBlockWithReferralNormalMethods;
}) => ReferralQuickMethods;
