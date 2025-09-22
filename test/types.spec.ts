import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  Scallop,
  ScallopClient,
  ScallopBuilder,
  ScallopQuery,
  ScallopUtils,
  ScallopIndexer,
  ScallopAddress,
  ScallopConstants,
} from '../src';

// Import types to verify they're exported
import type {
  ScallopParams,
  ScallopClientParams,
  ScallopQueryInterface,
  Obligation,
  MarketPool,
  MarketCollateral,
  ObligationAccount,
} from '../src';

describe('TypeScript Export Tests', () => {
  it('Should export Scallop class', () => {
    expect(Scallop).toBeDefined();
    expect(typeof Scallop).toBe('function');
  });

  it('Should export all client classes', () => {
    expect(ScallopClient).toBeDefined();
    expect(ScallopBuilder).toBeDefined();
    expect(ScallopQuery).toBeDefined();
    expect(ScallopUtils).toBeDefined();
    expect(ScallopIndexer).toBeDefined();
    expect(ScallopAddress).toBeDefined();
    expect(ScallopConstants).toBeDefined();
  });

  it('Should accept ScallopParams in constructor', () => {
    const params: ScallopParams = {
      networkType: 'mainnet',
    };

    const scallop = new Scallop(params);
    expect(scallop).toBeInstanceOf(Scallop);
    expect(scallop.client).toBeDefined();
  });

  it('Should have properly typed ScallopClient', () => {
    const clientParams: ScallopClientParams = {
      networkType: 'testnet',
    };

    const client = new ScallopClient(clientParams);
    expect(client).toBeInstanceOf(ScallopClient);
    expect(client.query).toBeDefined();
    expect(client.builder).toBeDefined();
    expect(client.utils).toBeDefined();
  });
});

describe('Type Definition Tests', () => {
  it('Should have complete Obligation type', () => {
    const obligation: Obligation = {
      id: 'test-id',
      keyId: 'test-key',
      locked: false,
    };

    expect(obligation.id).toBe('test-id');
    expect(obligation.keyId).toBe('test-key');
    expect(obligation.locked).toBe(false);
  });

  it('Should support optional Obligation properties', () => {
    const obligation: Obligation = {
      id: 'test-id',
      keyId: 'test-key',
      locked: false,
      deposits: [
        {
          coinType: '0x2::sui::SUI',
          amount: '1000000',
          coinName: 'sui',
          symbol: 'SUI',
        },
      ],
      borrows: [
        {
          coinType: '0xusdc',
          amount: '100000',
          borrowIndex: '1.1',
          coinName: 'usdc',
          symbol: 'USDC',
        },
      ],
      totalDepositValueInUSD: 1000,
      totalBorrowValueInUSD: 100,
      totalCollateralValueInUSD: 900,
      healthFactor: 1.5,
      netAPY: 0.05,
    };

    expect(obligation.deposits).toBeDefined();
    expect(obligation.deposits?.[0].coinType).toBe('0x2::sui::SUI');
    expect(obligation.borrows).toBeDefined();
    expect(obligation.healthFactor).toBe(1.5);
  });

  it('Should have MarketPool type with required properties', () => {
    const pool: Partial<MarketPool> = {
      coinName: 'sui',
      symbol: 'SUI',
      coinType: '0x2::sui::SUI',
      marketCoinType: '0xmarket',
      coinDecimal: 9,
      coinPrice: 1.5,
    };

    expect(pool.coinName).toBe('sui');
    expect(pool.symbol).toBe('SUI');
    expect(pool.coinDecimal).toBe(9);
  });

  it('Should have MarketCollateral type', () => {
    const collateral: Partial<MarketCollateral> = {
      coinName: 'usdc',
      symbol: 'USDC',
      coinType: '0xusdc',
      marketCoinType: '0xmarket',
      coinDecimal: 6,
      coinPrice: 1.0,
      isIsolated: false,
    };

    expect(collateral.coinName).toBe('usdc');
    expect(collateral.isIsolated).toBe(false);
  });

  it('Should have ObligationAccount type', () => {
    const account: Partial<ObligationAccount> = {
      obligationId: 'test-obligation',
      totalDepositedValue: 1000,
      totalBorrowedValue: 500,
      totalBalanceValue: 500,
      totalBorrowCapacityValue: 750,
      totalAvailableCollateralValue: 250,
      totalBorrowedValueWithWeight: 550,
      totalRequiredCollateralValue: 200,
      totalUnhealthyCollateralValue: 0,
      totalRiskLevel: 0.5,
      totalDepositedPools: 2,
      totalBorrowedPools: 1,
      totalRewardedPools: 1,
    };

    expect(account.obligationId).toBe('test-obligation');
    expect(account.totalDepositedValue).toBe(1000);
    expect(account.totalRiskLevel).toBe(0.5);
  });
});

describe('ScallopQueryInterface Tests', () => {
  it('Should define query interface methods', () => {
    // This test verifies that the interface is properly defined
    // The actual implementation is tested in other test files
    const mockQuery: Partial<ScallopQueryInterface> = {
      async queryMarket() {
        return { pools: {}, collaterals: {} };
      },
      async getMarketPools() {
        return { pools: {} };
      },
      async getMarketPool(_poolCoinName: string) {
        return undefined;
      },
      async getObligations() {
        return [];
      },
      async queryObligation(_obligationId: string) {
        return { id: _obligationId, keyId: 'key', locked: false };
      },
      indexer: {
        async getMarket() {
          return { pools: {}, collaterals: {} };
        },
      },
    };

    expect(mockQuery.queryMarket).toBeDefined();
    expect(mockQuery.getMarketPools).toBeDefined();
    expect(mockQuery.indexer?.getMarket).toBeDefined();
  });
});

describe('Type Inference Tests', () => {
  it('Should infer types correctly in async functions', async () => {
    const testFunction = async (sdk: Scallop) => {
      const client = await sdk.createScallopClient();

      // These should all have proper type inference
      expectTypeOf(client).toMatchTypeOf<ScallopClient>();
      expectTypeOf(client.query).toMatchTypeOf<ScallopQuery>();
      expectTypeOf(client.builder).toMatchTypeOf<ScallopBuilder>();
      expectTypeOf(client.utils).toMatchTypeOf<ScallopUtils>();

      return client;
    };

    // Just verify the function compiles with proper types
    expect(testFunction).toBeDefined();
  });

  it('Should handle optional properties correctly', () => {
    const handleObligation = (ob: Obligation) => {
      // Optional chaining should work without type errors
      const depositCount = ob.deposits?.length ?? 0;
      const borrowCount = ob.borrows?.length ?? 0;
      const health = ob.healthFactor ?? 1;

      return {
        depositCount,
        borrowCount,
        health,
      };
    };

    const result = handleObligation({
      id: 'test',
      keyId: 'key',
      locked: false,
    });

    expect(result.depositCount).toBe(0);
    expect(result.borrowCount).toBe(0);
    expect(result.health).toBe(1);
  });
});

describe('Backward Compatibility Tests', () => {
  it('Should maintain backward compatibility with existing code', () => {
    // Old code that should still work
    const obligation: Obligation = {
      id: 'test',
      keyId: 'key',
      locked: false,
    };

    // Should work without the new optional properties
    expect(obligation.id).toBe('test');
    expect(obligation.deposits).toBeUndefined();
  });

  it('Should work with both old and new property access patterns', () => {
    const obligation: Obligation = {
      id: 'test',
      keyId: 'key',
      locked: false,
      healthFactor: 1.8,
    };

    // Old pattern still works
    expect(obligation.id).toBe('test');

    // New pattern with optional chaining
    expect(obligation.healthFactor).toBe(1.8);
    expect(obligation.deposits?.length).toBeUndefined();
  });
});
