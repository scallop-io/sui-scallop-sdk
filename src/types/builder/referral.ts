import {
  SuiObjectArg,
  TransactionResult,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models';
import { SupportPoolCoins } from '../constant';

export type ReferralIds = {
  referralPgkId: string;
  referralBindings: string;
  referralRevenuePool: string;
  referralTiers: string;
  authorizedWitnessList: string;
  version: string;
};

export type ReferralNormalMethods = {
  bindToReferral: (veScaKeyId: string) => Promise<void>;
  claimReferralTicket: (
    poolCoinName: SupportPoolCoins
  ) => Promise<TransactionResult>;
  burnReferralTicket: (
    ticket: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => Promise<void>;
  claimReferralRevenue: (
    veScaKey: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => Promise<TransactionResult>;
};

export type ReferralQuickMethods = {
  claimReferralRevenueQuick: (
    veScaKey: SuiObjectArg,
    coinNames: SupportPoolCoins[]
  ) => Promise<void>;
};

export type SuiTxBlockWithReferralNormalMethods = SuiKitTxBlock &
  ReferralNormalMethods;
export type ReferralTxBlock = SuiTxBlockWithReferralNormalMethods &
  ReferralQuickMethods;

export type GenerateReferralNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => ReferralNormalMethods;

export type GenerateReferralQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithReferralNormalMethods;
}) => ReferralQuickMethods;
