import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import type { SpoolIds, GenerateSpoolNormalMethod } from 'src/types/index.js';

/**
 * Generate spool normal methods.
 *
 * @param ctx - Pure Move-call context (address reads, coin-type parsing, moveCall).
 * @param txBlock - TxBlock created by SuiKit .
 * @return Spool normal methods.
 */
export const generateSpoolNormalMethod: GenerateSpoolNormalMethod = ({
  ctx,
  txBlock,
}) => {
  const spoolIds: SpoolIds = {
    spoolPkg: ctx.address.get('spool.id'),
  };
  const clockObjectRef = txBlock.sharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    mutable: false,
    initialSharedVersion: '1',
  });

  return {
    createStakeAccount: (stakeMarketCoinName) => {
      const marketCoinType = ctx.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = ctx.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      return ctx.moveCall(
        txBlock,
        `${spoolIds.spoolPkg}::user::new_spool_account`,
        [stakePoolId, clockObjectRef],
        [marketCoinType]
      );
    },
    stake: (stakeAccount, coin, stakeMarketCoinName) => {
      const marketCoinType = ctx.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = ctx.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      ctx.moveCall(
        txBlock,
        `${spoolIds.spoolPkg}::user::stake`,
        [stakePoolId, stakeAccount, coin, clockObjectRef],
        [marketCoinType]
      );
    },
    unstake: (stakeAccount, amount, stakeMarketCoinName) => {
      const marketCoinType = ctx.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = ctx.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      return ctx.moveCall(
        txBlock,
        `${spoolIds.spoolPkg}::user::unstake`,
        [stakePoolId, stakeAccount, amount, clockObjectRef],
        [marketCoinType]
      );
    },
    claim: (stakeAccount, stakeMarketCoinName) => {
      const stakePoolId = ctx.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      ) as string;
      const rewardPoolId = ctx.address.get(
        `spool.pools.${stakeMarketCoinName}.rewardPoolId`
      ) as string;
      const marketCoinType = ctx.utils.parseMarketCoinType(stakeMarketCoinName);
      const rewardCoinName = ctx.utils.getSpoolRewardCoinName();
      const rewardCoinType = ctx.utils.parseCoinType(rewardCoinName);
      return ctx.moveCall(
        txBlock,
        `${spoolIds.spoolPkg}::user::redeem_rewards`,
        [stakePoolId, rewardPoolId, stakeAccount, clockObjectRef],
        [marketCoinType, rewardCoinType]
      );
    },
  };
};
