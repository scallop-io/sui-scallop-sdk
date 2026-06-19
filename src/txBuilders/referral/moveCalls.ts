import { SUI_CLOCK_OBJECT_ID, SuiObjectArg } from '@scallop-io/sui-kit';
import {
  GenerateReferralNormalMethod,
  ReferralIds,
} from 'src/types/builder/referral.js';

export const generateReferralNormalMethod: GenerateReferralNormalMethod = ({
  ctx,
  txBlock,
}) => {
  const referralIds: ReferralIds = {
    referralPgkId: ctx.address.get('referral.id'),
    referralBindings: ctx.address.get('referral.referralBindings'),
    referralRevenuePool: ctx.address.get('referral.referralRevenuePool'),
    authorizedWitnessList: ctx.address.get('referral.authorizedWitnessList'),
    referralTiers: ctx.address.get('referral.referralTiers'),
    version: ctx.address.get('referral.version'),
  };

  const veScaTable = ctx.address.get('vesca.table');
  const clockObjectRef = txBlock.sharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    mutable: false,
    initialSharedVersion: '1',
  });

  return {
    bindToReferral: (veScaKeyId: string) => {
      ctx.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::referral_bindings::bind_ve_sca_referrer`,
        [
          referralIds.referralBindings,
          txBlock.pure.id(veScaKeyId),
          veScaTable,
          clockObjectRef,
        ],
        []
      );
    },
    claimReferralTicket: (poolCoinName: string) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      return ctx.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::scallop_referral_program::claim_ve_sca_referral_ticket`,
        [
          referralIds.version,
          veScaTable,
          referralIds.referralBindings,
          referralIds.authorizedWitnessList,
          referralIds.referralTiers,
          clockObjectRef,
        ],
        [coinType]
      );
    },
    burnReferralTicket: (ticket: SuiObjectArg, poolCoinName: string) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      ctx.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::scallop_referral_program::burn_ve_sca_referral_ticket`,
        [
          referralIds.version,
          ticket,
          referralIds.referralRevenuePool,
          clockObjectRef,
        ],
        [coinType]
      );
    },
    claimReferralRevenue: (veScaKey: SuiObjectArg, poolCoinName: string) => {
      const coinType = ctx.utils.parseCoinType(poolCoinName);
      return ctx.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::referral_revenue_pool::claim_revenue_with_ve_sca_key`,
        [
          referralIds.version,
          referralIds.referralRevenuePool,
          veScaKey,
          clockObjectRef,
        ],
        [coinType]
      );
    },
    unbindReferral: () => {
      return ctx.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::referral_bindings::unbind_ve_sca_referrer`,
        [referralIds.referralBindings]
      );
    },
  };
};
