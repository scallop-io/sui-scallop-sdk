import { xOracleListType } from 'src/types/index.js';

/**
 * Static Pyth sponsored-update config (sponsor package + gas station object).
 *
 * These are protocol-owned constants, not part of the remote-fetched address
 * map (`ScallopAddress`), so they live here rather than behind `address.get(...)`
 * — a missing address path would resolve to `undefined` and break sponsored txs.
 */
export const PYTH_SPONSOR = {
  defaultPackageId:
    '0xa6f9bec2f9748656b6af8aafb5d7bc1a0d5faf25ac9645fc7f447822cd509325',
  gasStationId:
    '0xa8b8dcc9880166edb57b53e05f8df7364d31b5d9b7d107fd27f0b69cf338b687',
} as const;

export const xOracleList: xOracleListType = {
  usdc: { primary: ['pyth'], secondary: [] },
  sbeth: { primary: ['pyth'], secondary: [] },
  sbusdt: { primary: ['pyth'], secondary: [] },
  sbwbtc: { primary: ['pyth'], secondary: [] },
  weth: { primary: ['pyth'], secondary: [] },
  wbtc: { primary: ['pyth'], secondary: [] },
  wusdc: { primary: ['pyth'], secondary: [] },
  wusdt: { primary: ['pyth'], secondary: [] },
  sui: { primary: ['pyth'], secondary: [] },
  wapt: { primary: ['pyth'], secondary: [] },
  wsol: { primary: ['pyth'], secondary: [] },
  cetus: { primary: ['pyth'], secondary: [] },
  afsui: { primary: ['pyth'], secondary: [] },
  hasui: { primary: ['pyth'], secondary: [] },
  vsui: { primary: ['pyth'], secondary: [] },
  sca: { primary: ['pyth'], secondary: [] },
  fud: { primary: ['pyth'], secondary: [] },
  deep: { primary: ['pyth'], secondary: [] },
  fdusd: { primary: ['pyth'], secondary: [] },
  blub: { primary: ['pyth'], secondary: [] },
  musd: { primary: ['pyth'], secondary: [] },
  ns: { primary: ['pyth'], secondary: [] },
  usdy: { primary: ['pyth'], secondary: [] },
};
