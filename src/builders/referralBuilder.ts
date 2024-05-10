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
  GenerateReferralQuickMethod,
  ReferralIds,
  ReferralTxBlock,
  SuiTxBlockWithReferralNormalMethod,
} from 'src/types/builder/referral';
import { queryVeScaKeyIdFromReferralBindings } from 'src/queries';

/**
 * Check if current address is already binded
 * @param params
 * @returns
 */
const requireBindedVeScaKeyId = async (
  ...params: [
    builder: ScallopBuilder,
    txBlock: SuiKitTxBlock,
    veScaKeyId?: string | null,
  ]
) => {
  const [builder, txBlock, veScaKeyId] = params;
  txBlock.setSender(builder.suiKit.currentAddress());
  const sender = txBlock.blockData.sender!;

  const bindedVeScaKeyId = await queryVeScaKeyIdFromReferralBindings(
    builder.query,
    sender
  );

  if (veScaKeyId && bindedVeScaKeyId !== veScaKeyId)
    throw new Error('VeScaKeyId is different from the binded one');
  return bindedVeScaKeyId;
};

const generateReferralNormalMethod: GenerateReferralNormalMethod = ({
  builder,
  txBlock,
}) => {
  const referralIds: ReferralIds = {
    referralPgkId: '',
    referralBindings: '',
    referralRevenuePool: '',
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
          veScaKeyId,
          veScaIds.table,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    claimReferralTicket: (
      authorizedWitnessList: SuiObjectArg,
      poolCoinName: SupportCoins
    ) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::scallop_referral_program::claim_ve_sca_referral_ticket`,
        [
          veScaIds.table,
          referralIds.referralBindings,
          authorizedWitnessList,
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
  };
};

const generateReferralQuickMethod: GenerateReferralQuickMethod = ({
  builder,
  txBlock,
}) => {
  return {
    claimAndBurnReferralTicketQuick: async (
      authorizedWitnessList,
      poolCoinName,
      veScaKeyId,
      callback
    ) => {
      const bindedVeScaKeyId = await requireBindedVeScaKeyId(
        builder,
        txBlock,
        veScaKeyId
      );

      if (!bindedVeScaKeyId) {
        // bind first
        txBlock.bindToReferral(veScaKeyId);
      }

      const borrowReferral = txBlock.claimReferralTicket(
        authorizedWitnessList,
        poolCoinName
      );

      if (callback) callback(txBlock, borrowReferral);
      txBlock.burnReferralTicket(borrowReferral, poolCoinName);
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

  const normalTxBlock = new Proxy(txBlock, {
    get: (target, prop) => {
      if (prop in normalMethod) {
        return Reflect.get(normalMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as SuiTxBlockWithReferralNormalMethod;

  const quickMethod = generateReferralQuickMethod({
    builder,
    txBlock: normalTxBlock,
  });

  return new Proxy(normalTxBlock, {
    get: (target, prop) => {
      if (prop in quickMethod) {
        return Reflect.get(quickMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as ReferralTxBlock;
};
