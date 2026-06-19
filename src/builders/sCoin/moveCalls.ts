import { GenerateSCoinNormalMethod, sCoinPkgIds } from 'src/types/index.js';

export const generateSCoinNormalMethod: GenerateSCoinNormalMethod = ({
  ctx,
  txBlock,
}) => {
  const sCoinPkgIds: sCoinPkgIds = {
    pkgId: ctx.address.get('scoin.id'),
  };

  return {
    mintSCoin: (marketCoinName, marketCoin) => {
      const sCoinType = ctx.utils.parseSCoinType(marketCoinName);
      if (!sCoinType)
        throw new Error(`Invalid marketCoinName name: ${marketCoinName}`);

      return ctx.moveCall(
        txBlock,
        `${sCoinPkgIds.pkgId}::s_coin_converter::mint_s_coin`,
        [ctx.utils.getSCoinTreasury(marketCoinName), marketCoin],
        [sCoinType, ctx.utils.parseUnderlyingSCoinType(marketCoinName)]
      );
    },
    burnSCoin: (sCoinName, sCoin) => {
      const sCoinType = ctx.utils.parseSCoinType(sCoinName);
      if (!sCoinType) throw new Error(`Invalid sCoin name: ${sCoinName}`);

      return ctx.moveCall(
        txBlock,
        `${sCoinPkgIds.pkgId}::s_coin_converter::burn_s_coin`,
        [ctx.utils.getSCoinTreasury(sCoinName), sCoin],
        [sCoinType, ctx.utils.parseUnderlyingSCoinType(sCoinName)]
      );
    },
  };
};
