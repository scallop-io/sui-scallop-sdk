export const SUPPORT_ORACLES = ['supra', 'switchboard', 'pyth'] as const;
export const X_ORACLE_RULES = ['primary', 'secondary'] as const;
export const SUPPORT_ORACLE_LST = ['pyth'] as const;
export const SUPPORT_SUI_LST = ['afsui'] as const;

export const X_ORACLE_LIST: Record<
  string,
  Record<(typeof X_ORACLE_RULES)[number], (typeof SUPPORT_ORACLES)[number][]>
> = {
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
