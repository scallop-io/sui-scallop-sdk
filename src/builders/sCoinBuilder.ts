import { Transaction, SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models';
import {
  BaseScallopTxBlock,
  GenerateSCoinNormalMethod,
  GenerateSCoinQuickMethod,
  SCoinTxBlock,
  ScallopTxBlock,
  SuiTxBlockWithSCoinNormalMethods,
  sCoinPkgIds,
} from 'src/types';
import { requireSender } from 'src/utils';

const generateSCoinNormalMethod: GenerateSCoinNormalMethod = ({
  builder,
  txBlock,
}) => {
  const sCoinPkgIds: sCoinPkgIds = {
    pkgId: builder.address.get('scoin.id'),
  };

  return {
    mintSCoin: (marketCoinName, marketCoin) => {
      return builder.moveCall(
        txBlock,
        `${sCoinPkgIds.pkgId}::s_coin_converter::mint_s_coin`,
        [builder.utils.getSCoinTreasury(marketCoinName), marketCoin],
        [
          builder.utils.parseSCoinType(marketCoinName),
          builder.utils.parseUnderlyingSCoinType(marketCoinName),
        ]
      );
    },
    burnSCoin: (sCoinName, sCoin) => {
      return builder.moveCall(
        txBlock,
        `${sCoinPkgIds.pkgId}::s_coin_converter::burn_s_coin`,
        [builder.utils.getSCoinTreasury(sCoinName), sCoin],
        [
          builder.utils.parseSCoinType(sCoinName),
          builder.utils.parseUnderlyingSCoinType(sCoinName),
        ]
      );
    },
  };
};

const generateSCoinQuickMethod: GenerateSCoinQuickMethod = ({
  builder,
  txBlock,
}) => {
  return {
    mintSCoinQuick: async (marketCoinName, amount) => {
      const sender = requireSender(txBlock);
      const { leftCoin, takeCoin } = await builder.selectMarketCoin(
        txBlock,
        marketCoinName,
        amount,
        sender
      );

      txBlock.transferObjects([leftCoin], sender);
      return await txBlock.mintSCoin(marketCoinName, takeCoin);
    },
    burnSCoinQuick: async (sCoinName, amount) => {
      const sender = requireSender(txBlock);
      const { leftCoin, takeCoin } = await builder.selectSCoin(
        txBlock,
        sCoinName,
        amount,
        sender
      );

      txBlock.transferObjects([leftCoin], sender);
      return await txBlock.burnSCoin(sCoinName, takeCoin);
    },
  };
};

export const newSCoinTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?:
    | ScallopTxBlock
    | SuiKitTxBlock
    | Transaction
    | BaseScallopTxBlock
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
        ? initTxBlock
        : new SuiKitTxBlock();

  const normalMethod = generateSCoinNormalMethod({
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
  }) as SuiTxBlockWithSCoinNormalMethods;

  const quickMethod = generateSCoinQuickMethod({
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
  }) as SCoinTxBlock;
};
