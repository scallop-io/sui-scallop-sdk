import { SupportPoolCoins } from 'src/types/constant/common';

export const COIN_GECKGO_IDS: Record<SupportPoolCoins, string> = {
  usdc: 'usdc',
  sbeth: 'ethereum',
  // @TODO: verify whether sbusdt coin gecko id is the same with wusdt
  sbusdt: 'tether',
  weth: 'ethereum',
  wbtc: 'bitcoin',
  wusdc: 'usdc',
  wusdt: 'tether',
  sui: 'sui',
  wapt: 'aptos',
  wsol: 'solana',
  cetus: 'cetus-protocol',
  afsui: 'sui',
  hasui: 'sui',
  vsui: 'sui',
  sca: 'scallop-2',
  fdusd: 'first-digital-usd',
  deep: 'deepbook',
  fud: 'fud-the-pug',
};
