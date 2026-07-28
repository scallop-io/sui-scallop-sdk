import { GenerateSCoinQuickMethod } from 'src/types/index.js';
import { requireSender } from 'src/utils/builder.js';

export const generateSCoinQuickMethod: GenerateSCoinQuickMethod = ({
  ctx,
  txBlock,
}) => {
  return {
    mintSCoinQuick: async (marketCoinName, amount) => {
      const sender = requireSender(txBlock);
      const { takeCoin } = await ctx.coins.selectMarketCoin(
        txBlock,
        marketCoinName,
        amount,
        sender
      );

      return txBlock.mintSCoin(marketCoinName, takeCoin);
    },
    burnSCoinQuick: async (sCoinName, amount) => {
      const sender = requireSender(txBlock);
      const { takeCoin } = await ctx.coins.selectSCoin(
        txBlock,
        sCoinName,
        amount,
        sender
      );

      return txBlock.burnSCoin(sCoinName, takeCoin);
    },
  };
};
