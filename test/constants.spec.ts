import { describe, it, expect } from 'vitest';
import { scallopSDK } from './scallopSdk';
import { Whitelist } from 'src';

// const ENABLE_LOG = false;

describe('Test Scallop Constants API Fetch', async () => {
  const scallopConstants = await scallopSDK.getScallopConstants();

  it('Should have sucessfully fetched constants', () => {
    expect(scallopConstants.whitelist.lending.size > 0).toBe(true);
    expect(Object.values(scallopConstants.poolAddresses).length > 0).toBe(true);
  });
});

describe('Test Scallop Constants Values Overide', async () => {
  const scallopConstants = await scallopSDK.getScallopConstants();

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
