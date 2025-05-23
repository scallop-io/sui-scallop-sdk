import { describe, it, expect, beforeAll } from 'vitest';
import {
  POOL_ADDRESSES,
  ScallopConstants,
  TEST_ADDRESSES,
  WHITELIST,
  Whitelist,
} from 'src';
import { scallopSDK } from './scallopSdk';

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
      constantsParams: { forceWhitelistInterface: {} as Whitelist },
    });

    expect(Object.values(scallopConstants.whitelist.lending).length === 0).toBe(
      true
    );
  });

  it('Should override pool addresses', async () => {
    await scallopConstants.init({
      constantsParams: { forcePoolAddressInterface: {} },
    });

    expect(Object.values(scallopConstants.poolAddresses).length === 0).toBe(
      true
    );
  });
});

describe('Test Scallop Constants default values', () => {
  it('Should use default values when readApi is not available', async () => {
    const localScallopConstants = new ScallopConstants({
      addressId: '67c44a103fe1b8c454eb9699',
      defaultValues: {
        poolAddresses: POOL_ADDRESSES,
        whitelist: WHITELIST,
        addresses: { mainnet: TEST_ADDRESSES },
      },
    });

    expect(localScallopConstants.whitelist.lending.size).toBe(0);
    expect(Object.values(localScallopConstants.poolAddresses).length).toBe(0);
    expect(localScallopConstants.getAddresses()).toBe(undefined);

    localScallopConstants['readApi'] = () => {
      throw new Error('Intentional Error');
    };

    await localScallopConstants.init();
    expect(localScallopConstants.whitelist.lending.size > 0).toBe(true);
    expect(Object.values(localScallopConstants.poolAddresses).length > 0).toBe(
      true
    );
    expect(localScallopConstants.getAddresses()?.core.version).not.toBe('');
  });
});
