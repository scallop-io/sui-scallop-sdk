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

export type ReferralQuickMethods = {
  claimAndBurnReferralTicketQuick: (
    authorizedWitnessList: SuiObjectArg,
    poolCoinName: SupportPoolCoins,
    veScaKeyId: string,
    callback?: (
      txBlock: SuiTxBlockWithReferralNormalMethod,
      borrowReferral: SuiObjectArg
    ) => Promise<void>
  ) => Promise<void>;
};

export type SuiTxBlockWithReferralNormalMethod = SuiKitTxBlock &
  ReferralNormalMethods;

export type ReferralTxBlock = SuiTxBlockWithReferralNormalMethod &
  ReferralQuickMethods;

export type GenerateReferralNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlock;
}) => ReferralNormalMethods;

export type GenerateReferralQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithReferralNormalMethod;
}) => ReferralQuickMethods;
