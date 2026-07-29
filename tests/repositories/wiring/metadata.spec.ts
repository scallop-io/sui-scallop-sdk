import { describe, expect, it } from 'vitest';
import type ScallopUtils from 'src/models/scallopUtils/index.js';
import {
  buildObligationMetadata,
  buildBorrowIncentiveMetadata,
  buildReferralMetadata,
  buildVeScaMetadata,
  buildLoyaltyProgramMetadata,
  buildVeScaLoyaltyProgramMetadata,
  buildXOracleMetadata,
  buildPoolAddressesMetadata,
  buildMarketAddresses,
} from 'src/repositories/wiring/metadata.js';

// The `buildXMetadata` functions are pure projections from `ScallopUtils` into
// each repo's metadata shape. They are the ONE seam between models and repos, and
// `utils.address.get()` returns `any`, so a structural mistake (assigning a bare
// address string into a field typed as a nested object) is invisible to `tsc`.
// These tests assert the projected SHAPE — the thing the type system can't.
//
// Fake `utils`: `address.get` echoes the path so each leaf is a deterministic,
// path-identifiable string; `getAddresses` returns a minimal address tree.
// Parse helpers are arrow-wrapped in the builders (never called at build time),
// so they don't need to exist here.
const echo = (path: string): string => `0x_${path}`;

const addressesFixture = {
  scoin: { id: '0xscoin', coins: { ssui: '0xssui' } },
  core: {
    coins: { sui: { id: '0xsui' }, usdc: undefined },
    market: '0xmarket',
  },
  spool: { pools: { ssui: '0xspoolssui' } },
  vesca: { tableId: '0xvescatable' },
  veScaLoyaltyProgram: {
    veScaRewardPool: '0xrewardpool',
    veScaRewardTableId: '0xrewardtable',
  },
};

const fakeUtils = {
  address: { get: echo, getAddresses: () => addressesFixture },
  constants: {
    whitelist: {
      lending: new Set(['sui']),
      collateral: new Set(['sui']),
      scoin: new Set(['ssui']),
      spool: new Set(['ssui']),
    },
    poolAddresses: {},
    coinTypeToCoinNameMap: { '0x2::sui::SUI': 'sui' },
  },
} as unknown as ScallopUtils;

describe('buildObligationMetadata', () => {
  // Regression: `obligationNaming` was assigned the bare
  // `get('obligationNaming.registryTableId')` string instead of the
  // `{ registryTableId }` object the repo consumes as
  // `addresses.obligationNaming.registryTableId`. `get(): any` hid it from tsc;
  // the only prior test (registry.spec) asserted `instanceof`, never shape.
  it('nests obligationNaming as an object, not a bare string', () => {
    const md = buildObligationMetadata(fakeUtils);
    expect(md.addresses.obligationNaming).toEqual({
      registryTableId: '0x_obligationNaming.registryTableId',
    });
    // The exact regression guard: it must be a nested object, never the string.
    expect(typeof md.addresses.obligationNaming).toBe('object');
    expect(md.addresses.obligationNaming.registryTableId).toBe(
      '0x_obligationNaming.registryTableId'
    );
  });

  it('projects the flat core address fields', () => {
    const md = buildObligationMetadata(fakeUtils);
    expect(md.addresses).toMatchObject({
      protocolObjectId: '0x_core.object',
      queryPackageId: '0x_core.packages.query.id',
      version: '0x_core.version',
      market: '0x_core.market',
    });
  });
});

// Every builder whose metadata has a NESTED address object is a place the same
// string-vs-object mistake can recur. Assert each nested shape explicitly.
describe('metadata builders — nested address shapes', () => {
  it('buildBorrowIncentiveMetadata nests core/vesca objects', () => {
    const md = buildBorrowIncentiveMetadata(fakeUtils);
    expect(md.addresses.core).toEqual({ object: '0x_core.object' });
    expect(md.addresses.vesca).toEqual({ object: '0x_vesca.object' });
  });

  it('buildReferralMetadata nests referral object', () => {
    const md = buildReferralMetadata(fakeUtils);
    expect(md.addresses.referral).toEqual({
      bindingTableId: '0x_referral.bindingTableId',
    });
  });

  it('buildVeScaMetadata nests the veSca object', () => {
    const md = buildVeScaMetadata(fakeUtils);
    expect(md.addresses.veSca).toEqual({
      id: '0x_vesca.id',
      config: '0x_vesca.config',
      tableId: '0x_vesca.tableId',
      object: '0x_vesca.object',
      treasury: '0x_vesca.treasury',
    });
  });

  it('buildLoyaltyProgramMetadata nests the loyaltyProgram object', () => {
    const md = buildLoyaltyProgramMetadata(fakeUtils);
    expect(md.addresses.loyaltyProgram).toEqual({
      rewardPool: '0x_loyaltyProgram.rewardPool',
    });
  });

  it('buildVeScaLoyaltyProgramMetadata nests veSca + program objects', () => {
    const md = buildVeScaLoyaltyProgramMetadata(fakeUtils);
    expect(md.addresses.veSca).toEqual({ tableId: '0xvescatable' });
    expect(md.addresses.veScaLoyaltyProgram).toEqual({
      veScaRewardPool: '0xrewardpool',
      veScaRewardTableId: '0xrewardtable',
    });
  });

  it('buildXOracleMetadata nests the oracles policy object', () => {
    const md = buildXOracleMetadata(fakeUtils);
    expect(md.addresses.oracles).toMatchObject({
      primaryPriceUpdatePolicyObject:
        '0x_core.oracles.primaryPriceUpdatePolicyObject',
      switchboardRegistryTableId: '0x_core.oracles.switchboard.registryTableId',
    });
    // per-oracle projection must be objects with an `object` field, not strings
    expect(typeof md.addresses.xOracleObject).toBe('string');
  });

  it('buildPoolAddressesMetadata nests core/spool/scoin objects', () => {
    const md = buildPoolAddressesMetadata(fakeUtils);
    expect(md.addresses.core).toEqual({
      coins: addressesFixture.core.coins,
      market: '0xmarket',
    });
    expect(md.addresses.spool).toEqual({ pools: { ssui: '0xspoolssui' } });
    expect(md.addresses.scoin).toEqual({ coins: { ssui: '0xssui' } });
  });

  it('buildMarketAddresses projects flat ids', () => {
    expect(buildMarketAddresses(fakeUtils)).toEqual({
      queryPackageId: '0x_core.packages.query.id',
      market: '0x_core.market',
    });
  });
});
