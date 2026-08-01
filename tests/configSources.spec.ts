import { describe, expect, it } from 'vitest';
import {
  loadScallopConfigSnapshot,
  type ScallopConfigSources,
} from 'src/models/scallopConstants/config/index.js';
import { ADDRESSES, POOL_ADDRESSES, WHITELIST } from './mocks.js';

describe('config sources', () => {
  it('composes a config snapshot from source boundaries', () => {
    const sources: ScallopConfigSources = {
      addressSource: {
        getAddresses: () => ADDRESSES.mainnet,
      },
      poolAddressSource: {
        getPoolAddresses: () => POOL_ADDRESSES,
      },
      whitelistSource: {
        getWhitelist: () => WHITELIST as any,
      },
    };

    const snapshot = loadScallopConfigSnapshot(sources, {
      validate: true,
    });

    expect(snapshot.get('core.market')).toBe(ADDRESSES.mainnet.core.market);
    expect(snapshot.poolAddresses.sui).toBeTruthy();
    expect(snapshot.whitelist.lending.has('sui')).toBe(true);
  });
});
