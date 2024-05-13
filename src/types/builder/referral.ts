import {
  SuiObjectArg,
  TransactionResult,
  SuiTxBlock as SuiKitTxBlock,
  SuiTxBlock,
} from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models';
import { SupportPoolCoins } from '../constant';

export type ReferralIds = {
  referralPgkId: string;
  referralBindings: string;
  referralRevenuePool: string;
  authorizedWitnessList: string;
};

export type ReferralNormalMethods = {
  bindToReferral: (veScaKeyId: string) => void;
  claimReferralTicket: (poolCoinName: SupportPoolCoins) => TransactionResult;
  burnReferralTicket: (
    ticket: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => void;
  claimRevenue: (
    veScaKey: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
};

export type ReferralTxBlock = SuiKitTxBlock & ReferralNormalMethods;

export type GenerateReferralNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlock;
}) => ReferralNormalMethods;
