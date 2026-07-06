import { Whitelist } from './types.js';

export const DEFAULT_WHITELIST = {
  lending: new Set(),
  borrowing: new Set(),
  collateral: new Set(),
  packages: new Set(),
  scoin: new Set(),
  spool: new Set(),
  borrowIncentiveRewards: new Set(),
  rewardsAsPoint: new Set(),
  suiBridge: new Set(),
  wormhole: new Set(),
  layerZero: new Set(),
  oracles: new Set(),
  pythEndpoints: new Set(),
  deprecated: new Set(),
  emerging: new Set(),
} satisfies Whitelist;
