import { vi } from 'vitest';

// Records every gRPC call so we can assert on batching + retry behaviour.
const calls: { method: string; args: any }[] = [];
let batchGetObjectsFailuresLeft = 0;

// The exact error shape the gRPC transport throws (RpcError): a gRPC status
// *name* in `code`, and no `status` field.
class FakeRpcError extends Error {
  code = 'RESOURCE_EXHAUSTED';
  methodName = 'BatchGetObjects';
  serviceName = 'sui.rpc.v2.LedgerService';
  constructor() {
    super('Too Many Requests');
    this.name = 'RpcError';
  }
}

// deriveDynamicFieldID BCS-serializes the parent id, so table ids must be
// real 32-byte Sui addresses.
const addr = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;
let acCounter = 100;
const AC = (id: string) => ({
  id,
  keys: null,
  table: { id: addr(acCounter++), size: '2' },
  with_keys: false,
});

const MARKET_JSON = {
  asset_active_states: { base: AC(addr(1)), collateral: AC(addr(2)) },
  borrow_dynamics: AC(addr(3)),
  collateral_stats: AC(addr(4)),
  id: addr(9),
  interest_models: AC(addr(5)),
  limiters: AC(addr(6)),
  reward_factors: AC(addr(7)),
  risk_models: AC(addr(8)),
  vault: {
    balance_sheets: AC(addr(10)),
    flash_loan_fees: AC(addr(11)),
    id: addr(12),
    market_coin_supplies: { id: addr(13), bag: { id: addr(14), size: '1' } },
    underlying_balances: { id: addr(15), bag: { id: addr(16), size: '1' } },
  },
};

vi.mock('@mysten/sui/grpc', () => ({
  SuiGrpcClient: class {
    core = {
      getObject: async (args: any) => {
        calls.push({ method: 'getObject', args });
        return { object: { objectId: args.objectId, json: MARKET_JSON } };
      },
      getObjects: async (args: any) => {
        calls.push({ method: 'getObjects', args });
        if (batchGetObjectsFailuresLeft-- > 0) throw new FakeRpcError();
        // Report every 3rd id as missing, to exercise the existence check.
        return {
          objects: args.objectIds.map((id: string, i: number) =>
            i % 3 === 2
              ? new Error('Object not found')
              : { objectId: id, json: { id, value: true } }
          ),
        };
      },
      listDynamicFields: async (args: any) => {
        calls.push({ method: 'listDynamicFields', args });
        return { dynamicFields: [], hasNextPage: false, cursor: null };
      },
      getCoinMetadata: async (args: any) => {
        calls.push({ method: 'getCoinMetadata', args });
        return { coinMetadata: { decimals: 9 } };
      },
    };
  },
}));

// const { getPoolAddresses } = await import('misc/poolAddressesQuery.js');

// // 12 pools x 9 keys = 108 derived ids -> must batch into 3 requests of <=50.
// const POOL_COUNT = 12;
// const makeAddresses = (withDecimals: boolean) => {
//   const coins: Record<string, any> = {};
//   for (let i = 0; i < POOL_COUNT; i++) {
//     coins[`coin${i}`] = {
//       id: `0xid${i}`,
//       treasury: `0xt${i}`,
//       metaData: `0xm${i}`,
//       coinType: `0x${i.toString(16).padStart(64, '0')}::c::C`,
//       symbol: `C${i}`,
//       ...(withDecimals ? { decimals: 6 } : {}),
//       oracle: { pyth: { feed: `feed${i}`, feedObject: `0xfo${i}` } },
//     };
//   }
//   return {
//     core: { market: addr(9), coins },
//     spool: { pools: {} },
//     scoin: { coins: {} },
//   };
// };

// beforeEach(() => {
//   calls.length = 0;
//   batchGetObjectsFailuresLeft = 0;
// });

// describe('getPoolAddresses (mocked transport)', () => {
//   it('derives ids offline and fetches them in <=50-id batches', async () => {
//     const res = await getPoolAddresses('x', [], makeAddresses(true) as any);

//     // No per-field getDynamicField calls at all — ids are derived locally.
//     expect(calls.some((c) => c.method === 'getDynamicField')).toBe(false);

//     const batches = calls.filter((c) => c.method === 'getObjects');
//     const totalIds = batches.reduce((n, c) => n + c.args.objectIds.length, 0);
//     expect(totalIds).toBe(POOL_COUNT * 9);
//     expect(batches.length).toBe(Math.ceil((POOL_COUNT * 9) / 50));
//     batches.forEach((c) =>
//       expect(c.args.objectIds.length).toBeLessThanOrEqual(50)
//     );

//     // decimals came from the address API, so no getCoinMetadata RPC.
//     expect(calls.some((c) => c.method === 'getCoinMetadata')).toBe(false);
//     expect(Object.keys(res)).toHaveLength(POOL_COUNT);
//     expect(res.coin0.decimals).toBe(6);

//     // Derived ids are real 32-byte object ids.
//     expect(res.coin0.lendingPoolAddress).toMatch(/^0x[0-9a-f]{64}$/);
//   });

//   it('ids reported missing by the batch are emitted as empty strings', async () => {
//     const res = await getPoolAddresses('x', [], makeAddresses(true) as any);
//     const allFields = Object.values(res).flatMap((r: any) => [
//       r.lendingPoolAddress,
//       r.borrowFeeKey,
//       r.supplyLimitKey,
//     ]);
//     // Every 3rd id was returned as an Error, so some fields must be ''.
//     expect(allFields.some((v) => v === '')).toBe(true);
//     expect(allFields.some((v) => v !== '')).toBe(true);
//   });

//   it('retries RESOURCE_EXHAUSTED instead of rethrowing it', async () => {
//     // Fail the first two BatchGetObjects attempts with the real RpcError shape.
//     batchGetObjectsFailuresLeft = 2;
//     const res = await getPoolAddresses('x', [], makeAddresses(true) as any);
//     expect(Object.keys(res)).toHaveLength(POOL_COUNT);
//     // The 2 failures were retried on top of the successful batches.
//     expect(calls.filter((c) => c.method === 'getObjects').length).toBe(
//       Math.ceil((POOL_COUNT * 9) / 50) + 2
//     );
//   });

//   it('falls back to getCoinMetadata only when decimals is absent', async () => {
//     const res = await getPoolAddresses('x', [], makeAddresses(false) as any);
//     expect(calls.filter((c) => c.method === 'getCoinMetadata').length).toBe(
//       POOL_COUNT
//     );
//     expect(res.coin0.decimals).toBe(9);
//   });
// });
