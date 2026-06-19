import { describe, it, expect, beforeAll } from 'vitest';
import {
  POOL_ADDRESSES,
  ScallopConstants,
  TEST_ADDRESSES,
  WHITELIST,
  Whitelist,
} from 'src/entries/index.js';
import { scallopSDK } from '../scallopSdk.js';

let scallopConstants: ScallopConstants;
beforeAll(async () => {
  scallopConstants = await scallopSDK.getScallopConstants();
});

describe('Test Scallop Constants API Fetch', () => {
  it('Should have successfully fetched constants', () => {
    expect(scallopConstants.whitelist.lending.size > 0).toBe(true);
    expect(Object.values(scallopConstants.poolAddresses).length > 0).toBe(true);
  });
});

describe('Test Scallop Constants Values Override', () => {
  it('Should override whitelist', async () => {
    await scallopConstants.init({
      constantsParams: { forceWhitelistInterface: {} as Whitelist },
    });

    // whitelist sets are exposed as `Set`s — assert on `.size`, not
    // `Object.values(...).length` (which is always 0 for a Set).
    expect(scallopConstants.whitelist.lending.size).toBe(0);
  });

  it('Should override pool addresses', async () => {
    await scallopConstants.init({
      constantsParams: { forcePoolAddressInterface: {} },
    });

    expect(Object.values(scallopConstants.poolAddresses).length).toBe(0);
  });
});

describe('Test Scallop Constants default values', () => {
  it('Should fall back to default whitelist/poolAddresses when the API fetch fails', async () => {
    const localScallopConstants = new ScallopConstants({
      addressId: '695fcdc084f790c04eb068dc',
      // Seed addresses so init() skips the network address-read. NOTE: post-v4
      // `defaultValues.addresses` is no longer wired (ScallopAddress ignores it),
      // so addresses must be provided via forceAddressesInterface.
      forceAddressesInterface: { mainnet: TEST_ADDRESSES },
      defaultValues: {
        poolAddresses: POOL_ADDRESSES,
        whitelist: WHITELIST,
      },
    });

    // Before init the snapshot is the empty default.
    expect(localScallopConstants.whitelist.lending.size).toBe(0);
    expect(Object.values(localScallopConstants.poolAddresses).length).toBe(0);

    // Make the whitelist / pool-address HTTP fetch fail. The live
    // ConstantsSource catches the error and falls back to `defaultValues`.
    localScallopConstants.address.addressApiRepo.context.api.get =
      (async () => {
        throw new Error('Intentional Error');
      }) as never;

    await localScallopConstants.init();

    expect(localScallopConstants.whitelist.lending.size > 0).toBe(true);
    expect(Object.values(localScallopConstants.poolAddresses).length > 0).toBe(
      true
    );
  });
});

// SKIPPED — the multi-URL fallback (`urls: { addresses, poolAddresses, whitelist }`)
// is no longer wired post-v4: `ScallopAddress` builds a single-URL `ApiDataSource`
// and ignores `urls`. Re-enable (and re-wire) if multi-endpoint failover returns.
describe.skip('Test Scallop Constants url list', () => {
  it('Should try all the available urls on error', async () => {
    const localScallopConstants = new ScallopConstants({
      addressId: '695fcdc084f790c04eb068dc',
      timeout: 500,
      urls: {
        poolAddresses: [
          'https://suis.apis.scallop.io/pool/addresses', // not working url
          'https://backup.sui.apis.scallop.io/pool/addresses',
        ],
        whitelist: [
          'https://suis.apis.scallop.io/pool/whitelist', // not working url
          'https://backup.sui.apis.scallop.io/pool/whitelist',
        ],
        addresses: [
          'https://suis.apis.scallop.io', // not working url
          'https://backup.sui.apis.scallop.io',
        ],
      },
    });

    await localScallopConstants.init();
    expect(localScallopConstants.whitelist.lending.size > 0).toBe(true);
  });
});
