export const PYTH_ENDPOINTS: {
  [k in 'mainnet' | 'testnet']: Readonly<string[]>;
} = {
  testnet: ['https://hermes-beta.pyth.network'],
  mainnet: ['https://hermes.pyth.network', 'https://scallop.rpc.p2p.world'],
} as const;
