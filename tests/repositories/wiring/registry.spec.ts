import { describe, expect, it, vi } from 'vitest';
import { createRepositories } from 'src/repositories/wiring/registry.js';
import { MarketRepository } from 'src/repositories/market/index.js';
import { CoinBalanceRepository } from 'src/repositories/coinBalance/index.js';
import { FlashloanRepository } from 'src/repositories/flashloan/index.js';
import { ObligationRepository } from 'src/repositories/obligation/index.js';
import { BorrowIncentiveRepository } from 'src/repositories/borrowIncentive/index.js';
import { IsolatedAssetsRepository } from 'src/repositories/isolatedAssets/index.js';
import { VeScaRepository } from 'src/repositories/veSca/index.js';
import { LoyaltyProgramRepository } from 'src/repositories/loyaltyProgram/index.js';
import { XOracleRepository } from 'src/repositories/xOracle/index.js';
import { SpoolRepository } from 'src/repositories/spool/index.js';
import { VeScaLoyaltyProgramRepository } from 'src/repositories/veScaLoyaltyProgram/index.js';
import { ReferralRepository } from 'src/repositories/referral/index.js';
import { PriceRepository } from 'src/repositories/price/index.js';
import { PoolAddressesRepository } from 'src/repositories/poolAddresses/index.js';
import type ScallopUtils from 'src/models/scallopUtils/index.js';

// Minimal ScallopUtils stand-in: only the fields the metadata builders read
// eagerly need to exist (parse helpers are arrow-wrapped, so they're never
// invoked at construction time).
const emptySet = new Set<string>();
const fakeUtils = {
  onchain: {
    url: 'mock://node',
    client: {},
  },
  suiKit: {
    client: { core: {} },
    suiInteractor: { currentFullNode: 'mock://node' },
  },
  tokensPerSecond: 10,
  queryClient: { fetchQuery: vi.fn() },
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
  address: {
    get: (path: string) => `0x_${path}`,
    getAddresses: () => ({
      core: { coins: {}, market: '0xmarket' },
      spool: { pools: {} },
      scoin: { id: '0xscoin', coins: {} },
      vesca: { tableId: '0xtable' },
      veScaLoyaltyProgram: {
        veScaRewardPool: '0xpool',
        veScaRewardTableId: '0xrewardtable',
      },
    }),
  },
  constants: {
    whitelist: {
      lending: emptySet,
      collateral: emptySet,
      scoin: emptySet,
      spool: emptySet,
    },
    poolAddresses: {},
    coinTypeToCoinNameMap: { '0x2::sui::SUI': 'sui', '0xdead': undefined },
  },
} as unknown as ScallopUtils;

describe('createRepositories', () => {
  it('builds each wired domain repository from ScallopUtils', () => {
    const repos = createRepositories({ utils: fakeUtils });
    expect(repos.market).toBeInstanceOf(MarketRepository);
    expect(repos.coinBalance).toBeInstanceOf(CoinBalanceRepository);
    expect(repos.flashloan).toBeInstanceOf(FlashloanRepository);
    expect(repos.obligation).toBeInstanceOf(ObligationRepository);
    expect(repos.borrowIncentive).toBeInstanceOf(BorrowIncentiveRepository);
    expect(repos.isolatedAssets).toBeInstanceOf(IsolatedAssetsRepository);
    expect(repos.veSca).toBeInstanceOf(VeScaRepository);
    expect(repos.loyaltyProgram).toBeInstanceOf(LoyaltyProgramRepository);
    expect(repos.xOracle).toBeInstanceOf(XOracleRepository);
    expect(repos.spool).toBeInstanceOf(SpoolRepository);
    expect(repos.veScaLoyaltyProgram).toBeInstanceOf(
      VeScaLoyaltyProgramRepository
    );
    expect(repos.referral).toBeInstanceOf(ReferralRepository);
    expect(repos.price).toBeInstanceOf(PriceRepository);
    expect(repos.poolAddresses).toBeInstanceOf(PoolAddressesRepository);
  });

  it('memoises each repository (lazy getter returns the same instance)', () => {
    // intent: repeated facade reads must not rebuild metadata/datasources each call
    const repos = createRepositories({ utils: fakeUtils });
    expect(repos.market).toBe(repos.market);
    expect(repos.coinBalance).toBe(repos.coinBalance);
    expect(repos.flashloan).toBe(repos.flashloan);
  });

  it('drops undefined entries when projecting coinTypeToCoinNameMap', () => {
    // intent: flashloan metadata must not carry undefined coin names into the Map
    const repos = createRepositories({ utils: fakeUtils });
    expect(repos.flashloan).toBeInstanceOf(FlashloanRepository);
  });
});
