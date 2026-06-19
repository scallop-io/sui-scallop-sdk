import { SUI_CLOCK_OBJECT_ID } from '@scallop-io/sui-kit';
import type {
  AddressesInterface,
  GenerateVeScaNormalMethod,
} from 'src/types/index.js';

type VeScaProps = 'id' | 'table' | 'treasury' | 'config' | 'subsTable';

/**
 * Generate veSCA normal methods.
 *
 * @param ctx - Pure Move-call context (address reads, coin-type parsing, moveCall).
 * @param txBlock - TxBlock created by SuiKit .
 * @return veSCA normal methods.
 */
export const generateNormalVeScaMethod: GenerateVeScaNormalMethod = ({
  ctx,
  txBlock,
}) => {
  const veScaIds: Pick<AddressesInterface['vesca'], VeScaProps> = {
    id: ctx.address.get('vesca.id'),
    table: ctx.address.get('vesca.table'),
    treasury: ctx.address.get('vesca.treasury'),
    config: ctx.address.get('vesca.config'),
    subsTable: ctx.address.get('vesca.subsTable'),
  };

  const clockObjectRef = txBlock.sharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    mutable: false,
    initialSharedVersion: '1',
  });

  return {
    lockSca: (scaCoin, unlockAtInSecondTimestamp) => {
      return ctx.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::mint_ve_sca_key`,
        [
          veScaIds.config,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          unlockAtInSecondTimestamp,
          clockObjectRef,
        ],
        []
      );
    },
    extendLockPeriod: (veScaKey, newUnlockAtInSecondTimestamp) => {
      ctx.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::extend_lock_period`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          newUnlockAtInSecondTimestamp,
          clockObjectRef,
        ],
        []
      );
    },
    extendLockAmount: (veScaKey, scaCoin) => {
      ctx.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::lock_more_sca`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          clockObjectRef,
        ],
        []
      );
    },
    renewExpiredVeSca: (veScaKey, scaCoin, newUnlockAtInSecondTimestamp) => {
      ctx.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::renew_expired_ve_sca`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          newUnlockAtInSecondTimestamp,
          clockObjectRef,
        ],
        []
      );
    },
    redeemSca: (veScaKey) => {
      return ctx.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::redeem`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          clockObjectRef,
        ],
        []
      );
    },
    mintEmptyVeSca: () => {
      return ctx.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::mint_ve_sca_placeholder_key`,
        [veScaIds.config, veScaIds.table],
        []
      );
    },
    splitVeSca: (veScaKey, splitAmount) => {
      return ctx.moveCall(txBlock, `${veScaIds.id}::ve_sca::split`, [
        veScaIds.config,
        veScaKey,
        veScaIds.table,
        veScaIds.subsTable,
        txBlock.pure.u64(splitAmount),
      ]);
    },
    mergeVeSca: (targetKey, sourceKey) => {
      return ctx.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::merge`,
        [
          veScaIds.config,
          targetKey,
          sourceKey,
          veScaIds.table,
          veScaIds.subsTable,
          txBlock.sharedObjectRef({
            objectId: SUI_CLOCK_OBJECT_ID,
            mutable: false,
            initialSharedVersion: '1',
          }),
        ],
        []
      );
    },
  };
};
