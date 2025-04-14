import { describe, it, expect, beforeAll } from 'vitest';
import { scallopSDK } from './scallopSdk';
import { ScallopConstants, Whitelist } from 'src';

// const ENABLE_LOG = false;
let scallopConstants: ScallopConstants;
beforeAll(async () => {
  scallopConstants = await scallopSDK.getScallopConstants();
});

describe('Test Scallop Constants API Fetch', () => {
  it('Should have sucessfully fetched constants', () => {
    expect(scallopConstants.whitelist.lending.size > 0).toBe(true);
    expect(Object.values(scallopConstants.poolAddresses).length > 0).toBe(true);
  });
});

describe('Test Scallop Constants Values Overide', () => {
  it('Should override whitelist', async () => {
    await scallopConstants.init({
      forceWhitelistInterface: {} as Whitelist,
    });

    expect(Object.values(scallopConstants.whitelist).length === 0).toBe(true);
  });

  it('Should override pool addresses', async () => {
    await scallopConstants.init({
      forcePoolAddressInterface: {},
    });

    expect(Object.values(scallopConstants.poolAddresses).length === 0).toBe(
      true
    );
  });
});
