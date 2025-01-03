import { SupportPoolCoins } from 'src/types';

export const PYTH_ENDPOINTS: {
  [k in 'mainnet' | 'testnet']: string[];
} = {
  testnet: ['https://hermes-beta.pyth.network'],
  mainnet: ['https://hermes.pyth.network', 'https://scallop.rpc.p2p.world'],
};

export const PYTH_FEED_IDS: Record<SupportPoolCoins, string> = {
  usdc: 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  sbeth: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  sbusdt: '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  weth: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  wbtc: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  wusdc: 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  wusdt: '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  sui: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  wapt: '03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5',
  wsol: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  cetus: 'e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef',
  afsui: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  hasui: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  vsui: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  sca: '7e17f0ac105abe9214deb9944c30264f5986bf292869c6bd8e8da3ccd92d79bc',
  fdusd: '0xccdc1a08923e2e4f4b1e6ea89de6acbc5fe1948e9706f5604b8cb50bc1ed3979',
  deep: '29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7c6d9f7ff',
  fud: '6a4090703da959247727f2b490eb21aea95c8684ecfac675f432008830890c75',
};
