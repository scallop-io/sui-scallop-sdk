import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
  SuiObjectArg,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type {
  TransactionArgument,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import type { ScallopBuilder } from '../../models';
import type {
  SupportStakeMarketCoins,
  SupportStakeRewardCoins,
} from '../constant';

export type SpoolIds = {
  spoolPkg: string;
  spoolConfig: string;
};

// Old version
// export type SpoolNormalMethods = {
//   createStakeAccount: (
//     stakeMarketCoinName: SupportStakeMarketCoins
//   ) => TransactionResult;
//   stake: (
//     stakeAccount: SuiAddressArg,
//     coin: SuiObjectArg,
//     stakeMarketCoinName: SupportStakeMarketCoins
//   ) => void;
//   unstake: (
//     stakeAccount: SuiAddressArg,
//     amount: SuiTxArg,
//     stakeMarketCoinName: SupportStakeMarketCoins
//   ) => TransactionResult;
//   claim: (
//     stakeAccount: SuiAddressArg,
//     stakeMarketCoinName: SupportStakeMarketCoins
//   ) => TransactionResult;
// };

/*
  pool_config: &SpoolConfig,
  spool: &mut Spool,
  rewards_pool: &mut RewardsPool<RewardType>,
  spool_account: &mut SpoolAccount<StakeType>,
  spool_account_key: &SpoolAccountKey,
  clock: &Clock,
  ctx: &mut TxContext,
*/

export type SpoolNormalMethods = {
  createStakeAccount: (
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
  completeAccountCreation: (
    stakeAccount: SuiAddressArg,
    hotPotato: SuiAddressArg,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => void;
  stake: (
    stakeAccount: SuiAddressArg,
    coin: SuiObjectArg,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => void;
  stakeWithVeSca: (
    stakeAccount: SuiAddressArg,
    stakeAccountKey: SuiAddressArg,
    coin: SuiObjectArg,
    stakeMarketCoinName: SupportStakeMarketCoins,
    veScaKey: SuiAddressArg
  ) => void;
  unstake: (
    stakeAccount: SuiAddressArg,
    stakeAccountKey: SuiAddressArg,
    amount: SuiTxArg,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
  unstakeWithVeSca: (
    stakeAccount: SuiAddressArg,
    stakeAccountKey: SuiAddressArg,
    amount: SuiTxArg,
    stakeMarketCoinName: SupportStakeMarketCoins,
    veScaKey: SuiAddressArg
  ) => TransactionResult;
  claim: (
    stakeAccount: SuiAddressArg,
    stakeAccountKey: SuiAddressArg,
    stakeMarketCoinName: SupportStakeMarketCoins,
    rewardCoinName: SupportStakeRewardCoins
  ) => TransactionResult;
};

// Old version
// export type SpoolQuickMethods = {
//   stakeQuick(
//     amountOrMarketCoin: SuiObjectArg | number,
//     stakeMarketCoinName: SupportStakeMarketCoins,
//     stakeAccountId?: SuiAddressArg
//   ): Promise<void>;
//   unstakeQuick(
//     amount: number,
//     stakeMarketCoinName: SupportStakeMarketCoins,
//     stakeAccountId?: SuiAddressArg
//   ): Promise<TransactionResult[]>;
//   claimQuick(
//     stakeMarketCoinName: SupportStakeMarketCoins,
//     stakeAccountId?: SuiAddressArg
//   ): Promise<TransactionResult[]>;
// };

export type SpoolQuickMethods = {
  stakeQuick(
    amountOrMarketCoin: SuiObjectArg | number,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg,
    stakeAccountKey?: SuiAddressArg
  ): Promise<void>;
  stakeWithVeScaQuick(
    amountOrMarketCoin: SuiObjectArg | number,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg,
    stakeAccountKey?: SuiAddressArg,
    veScaKey?: SuiAddressArg
  ): Promise<void>;
  unstakeQuick(
    amount: number,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg,
    stakeAccountKey?: SuiAddressArg
  ): Promise<TransactionResult[]>;
  unstakeWithVeScaQuick(
    amount: number,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg,
    veScaKey?: SuiAddressArg
  ): Promise<TransactionResult[]>;
  claimQuick(
    stakeMarketCoinName: SupportStakeMarketCoins,
    rewardCoinName: SupportStakeRewardCoins,
    stakeAccountId?: SuiAddressArg
  ): Promise<TransactionResult[]>;
};

export type SpoolMigrateMethods = {
  migrateNewSpoolQuick: () => Promise<void>;
  createStakeAccountQuick: (
    stakeMarketCoinName: SupportStakeMarketCoins,
    callback?: (
      txBlock: SuiTxBlockWithSpoolQuickMethods,
      account: SuiAddressArg,
      accountKey: SuiAddressArg
    ) => Promise<void>
  ) => Promise<
    Extract<
      TransactionArgument,
      {
        kind: 'NestedResult';
      }
    >
  >;
};

export type SuiTxBlockWithSpoolNormalMethods = SuiKitTxBlock &
  SpoolNormalMethods;

export type SuiTxBlockWithSpoolQuickMethods = SuiTxBlockWithSpoolNormalMethods &
  SpoolQuickMethods;
export type SpoolTxBlock = SuiTxBlockWithSpoolNormalMethods &
  SpoolQuickMethods &
  SpoolMigrateMethods;

export type GenerateSpoolNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => SpoolNormalMethods;

export type GenerateSpoolQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithSpoolNormalMethods;
}) => SpoolQuickMethods;

export type GenerateSpoolMigrateMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithSpoolQuickMethods;
}) => SpoolMigrateMethods;
