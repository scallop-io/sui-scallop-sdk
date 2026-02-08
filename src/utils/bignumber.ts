import BN from 'bignumber.js';

/**
 * BigNumber constructor for decimal arithmetic.
 * bignumber.js default export typing can fail with ESM interop; cast to Constructor for full API.
 */
export const BigNumber =
  BN as unknown as import('bignumber.js').BigNumber.Constructor;
