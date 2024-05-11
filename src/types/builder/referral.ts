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
  witnessType: string;
};

export type ReferralNormalMethods = {
  bindToReferral: (veScaKeyId: string) => void;
  claimReferralTicket: (
    authorizedWitnessList: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  burnReferralTicket: (
    ticket: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => void;
};

export type ReferralTxBlock = SuiKitTxBlock & ReferralNormalMethods;

export type GenerateReferralNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlock;
}) => ReferralNormalMethods;
