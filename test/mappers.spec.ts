import { describe, expect, it } from 'vitest';
import { normalizeStructTag } from '@mysten/sui/utils';
import {
  mapBorrowIncentiveAccountsEvent,
  mapBorrowIncentivePoolsEvent,
  mapMarketEventToMarketData,
  mapObligationEventToObligationData,
  mapSpoolData,
  parseMoveTypeName,
} from 'src/mappers/index.js';
import type {
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentivePoolsQueryInterface,
  MarketQueryInterface,
  ObligationQueryInterface,
  OriginSpoolData,
} from 'src/types/index.js';

const suiType = normalizeStructTag('0x2::sui::SUI');
const scaType = normalizeStructTag('0x2::coin::Coin<0x2::sui::SUI>');
const grpcSuiType = {
  name: {
    address: '0x2',
    module: 'sui',
    name: 'SUI',
  },
};
const grpcCoinType = {
  name: {
    address: '0x2',
    module: 'coin',
    name: 'Coin',
    typeParams: [grpcSuiType],
  },
};

describe('Move type mappers', () => {
  it('normalizes string, JSON-RPC, and gRPC Move type names', () => {
    expect(parseMoveTypeName('0x2::sui::SUI')).toBe(suiType);
    expect(parseMoveTypeName({ name: '0x2::sui::SUI' })).toBe(suiType);
    expect(parseMoveTypeName(grpcSuiType)).toBe(suiType);
    expect(parseMoveTypeName(grpcCoinType)).toBe(scaType);
  });

  it('throws with path context for malformed mapper payloads', () => {
    const market = {
      pools: [{ type: { name: null } }],
      collaterals: [],
    } as unknown as MarketQueryInterface;

    expect(() => mapMarketEventToMarketData(market)).toThrow(
      'market.pools[0].type'
    );
  });

  it('maps market event payload types', () => {
    const market = {
      pools: [{ type: grpcSuiType }],
      collaterals: [{ type: { name: '0x2::sui::SUI' } }],
    } as unknown as MarketQueryInterface;

    const mapped = mapMarketEventToMarketData(market);

    expect(mapped?.pools[0].type).toBe(suiType);
    expect(mapped?.collaterals[0].type).toBe(suiType);
  });

  it('maps obligation event payload types', () => {
    const obligation = {
      collaterals: [{ type: grpcSuiType, amount: '1' }],
      debts: [{ type: { name: '0x2::sui::SUI' }, amount: '1' }],
    } as unknown as ObligationQueryInterface;

    const mapped = mapObligationEventToObligationData(obligation);

    expect(mapped?.collaterals[0].type).toBe(suiType);
    expect(mapped?.debts[0].type).toBe(suiType);
  });

  it('maps borrow incentive pool and account payload types', () => {
    const pools = {
      incentive_pools: [
        {
          pool_type: grpcSuiType,
          points: [{ point_type: grpcCoinType }],
        },
      ],
    } as unknown as BorrowIncentivePoolsQueryInterface;
    const accounts = {
      pool_records: [
        {
          pool_type: { name: '0x2::sui::SUI' },
          points_list: [{ point_type: grpcCoinType }],
        },
      ],
    } as unknown as BorrowIncentiveAccountsQueryInterface;

    const mappedPools = mapBorrowIncentivePoolsEvent(pools);
    const mappedAccounts = mapBorrowIncentiveAccountsEvent(accounts);

    expect(mappedPools?.incentive_pools[0].pool_type).toBe(suiType);
    expect(mappedPools?.incentive_pools[0].points[0].point_type).toBe(scaType);
    expect(mappedAccounts?.pool_records[0].pool_type).toBe(suiType);
    expect(mappedAccounts?.pool_records[0].points_list[0].point_type).toBe(
      scaType
    );
  });

  it('maps spool stake type payloads', () => {
    const spool = {
      stakeType: grpcCoinType,
    } as unknown as OriginSpoolData;

    expect(mapSpoolData(spool).stakeType).toBe(scaType);
  });
});
