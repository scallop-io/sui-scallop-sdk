import { SupportPoolCoins } from 'src/types/constant/common';

export const COIN_GECKGO_IDS: Record<SupportPoolCoins, string> = {
  // Sui Bridge
  sbeth: 'ethereum',
  sbusdt: 'tether',
  sbwbtc: 'bitcoin',
  // Wormhole
  weth: 'ethereum',
  wbtc: 'bitcoin',
  wusdc: 'usdc',
  wusdt: 'tether',
  wapt: 'aptos',
  wsol: 'solana',
  // Sui Native
  usdc: 'usdc',
  // Sui LST
  sui: 'sui',
  afsui: 'sui',
  hasui: 'sui',
  vsui: 'sui',
  // Stable
  fdusd: 'first-digital-usd',
  // DeFi
  cetus: 'cetus-protocol',
  sca: 'scallop-2',
  deep: 'deepbook',
  // Isolated Asset
  fud: 'fud-the-pug',
  blub: 'blub',
  musd: '', // @TODO: add coinGecko id
};
