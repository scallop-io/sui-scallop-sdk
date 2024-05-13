import { ScallopBuilder } from 'src/models';
import { ScallopTxBlock, SupportCoins, VescaIds } from 'src/types';
import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
  TransactionBlock,
} from '@scallop-io/sui-kit';
import {
  GenerateReferralNormalMethod,
  ReferralIds,
  ReferralTxBlock,
} from 'src/types/builder/referral';

const generateReferralNormalMethod: GenerateReferralNormalMethod = ({
  builder,
  txBlock,
}) => {
  const referralIds: ReferralIds = {
    referralPgkId: builder.address.get('referral.id'),
    referralBindings: builder.address.get('referral.referralBindings'),
    referralRevenuePool: builder.address.get('referral.referralRevenuePool'),
    authorizedWitnessList: builder.address.get(
      'referral.authorizedWitnessList'
    ),
  };

  const veScaIds: VescaIds = {
    pkgId: builder.address.get('vesca.id'),
    table: builder.address.get('vesca.table'),
    treasury: builder.address.get('vesca.treasury'),
    config: builder.address.get('vesca.config'),
  };

  return {
    bindToReferral: (veScaKeyId: string) => {
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::referral_bindings::bind_ve_sca_referrer`,
        [
          referralIds.referralBindings,
          txBlock.pure(veScaKeyId),
          veScaIds.table,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    claimReferralTicket: (poolCoinName: SupportCoins) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::scallop_referral_program::claim_ve_sca_referral_ticket`,
        [
          veScaIds.table,
          referralIds.referralBindings,
          referralIds.authorizedWitnessList,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
    burnReferralTicket: (ticket: SuiObjectArg, poolCoinName: SupportCoins) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::scallop_referral_program::burn_ve_sca_referral_ticket`,
        [ticket, referralIds.referralRevenuePool],
        [coinType]
      );
    },
    claimRevenue: (veScaKey: SuiObjectArg, poolCoinName: SupportCoins) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::referral_revenue_pool::claim_revenue_with_ve_sca`,
        [referralIds.referralRevenuePool, veScaKey],
        [coinType]
      );
    },
  };
};

/**
 * Create an enhanced transaction block instance for interaction with borrow incentive modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop borrow incentive txBlock.
 */
export const newReferralTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
) => {
  const txBlock =
    initTxBlock instanceof TransactionBlock
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
      ? initTxBlock
      : new SuiKitTxBlock();

  const normalMethod = generateReferralNormalMethod({
    builder,
    txBlock,
  });

  return new Proxy(txBlock, {
    get: (target, prop) => {
      if (prop in normalMethod) {
        return Reflect.get(normalMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as ReferralTxBlock;
};
