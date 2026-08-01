import { describe, expect, it } from 'vitest';
import ScallopConstants from 'src/models/scallopConstants/index.js';
import { ScallopConfigError } from 'src/errors/index.js';
import { ADDRESSES, POOL_ADDRESSES, WHITELIST } from './mocks.js';

const queryClientConfig = {
  defaultOptions: {
    queries: { staleTime: Infinity, gcTime: Infinity, retry: false },
  },
};

describe('ScallopConstants strict-init', () => {
  it('init() resolves cleanly when forced interfaces satisfy required paths', async () => {
    const constants = new ScallopConstants({
      addressId: '695fcdc084f790c04eb068dc',
      network: 'mainnet',
      forceAddressesInterface: ADDRESSES,
      forcePoolAddressInterface: POOL_ADDRESSES,
      forceWhitelistInterface: WHITELIST,
      strictInit: true,
      queryClientConfig,
    });

    await expect(
      constants.init({ network: 'mainnet' })
    ).resolves.toBeUndefined();
  });

  it('exposes readonly whitelist and pool-address snapshots', async () => {
    const constants = new ScallopConstants({
      addressId: '695fcdc084f790c04eb068dc',
      network: 'mainnet',
      forceAddressesInterface: ADDRESSES,
      forcePoolAddressInterface: POOL_ADDRESSES,
      forceWhitelistInterface: WHITELIST,
      queryClientConfig,
    });

    await constants.init({ network: 'mainnet' });

    expect(() => constants.whitelist.lending.clear()).toThrow(TypeError);
    expect(() => {
      (constants.poolAddresses as Record<string, unknown>).newPool = {};
    }).toThrow(TypeError);
    expect(() => {
      (constants.poolAddresses.sui as Record<string, unknown>).coinName =
        'mutated';
    }).toThrow(TypeError);
  });

  it('init() throws ScallopConfigError when a required core path is empty', async () => {
    const brokenAddresses = {
      mainnet: {
        ...ADDRESSES.mainnet,
        core: {
          ...ADDRESSES.mainnet.core,
          market: '',
        },
      },
    };

    const constants = new ScallopConstants({
      addressId: '695fcdc084f790c04eb068dc',
      network: 'mainnet',
      forceAddressesInterface: brokenAddresses,
      forcePoolAddressInterface: POOL_ADDRESSES,
      forceWhitelistInterface: WHITELIST,
      strictInit: true,
      queryClientConfig,
    });

    let caught: unknown;
    try {
      await constants.init({ network: 'mainnet' });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ScallopConfigError);
    expect((caught as ScallopConfigError).code).toBe('SCALLOP_CONFIG_ERROR');
    expect((caught as ScallopConfigError).context?.missingPaths).toContain(
      'core.market'
    );
  });

  it('init() does not throw on incomplete config when strictInit is false', async () => {
    const brokenAddresses = {
      mainnet: {
        ...ADDRESSES.mainnet,
        core: {
          ...ADDRESSES.mainnet.core,
          market: '',
        },
      },
    };

    const constants = new ScallopConstants({
      addressId: '695fcdc084f790c04eb068dc',
      network: 'mainnet',
      forceAddressesInterface: brokenAddresses,
      forcePoolAddressInterface: POOL_ADDRESSES,
      forceWhitelistInterface: WHITELIST,
      // strictInit omitted -> default false
      queryClientConfig,
    });

    await expect(
      constants.init({ network: 'mainnet' })
    ).resolves.toBeUndefined();
  });
});
