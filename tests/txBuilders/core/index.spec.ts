import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the orchestrator so we can inspect exactly which `OracleActionContext`
// `newCoreTxBlock` builds for the legacy vs. current call, without having to
// drive the full xOracle rule registry.
const updateOraclesMock = vi.fn();
vi.mock('src/txBuilders/core/oracles/index.js', () => ({
  updateOracles: (...args: unknown[]) => updateOraclesMock(...args),
}));

import { newCoreTxBlock } from 'src/txBuilders/core/index.js';
import { LEGACY_PYTH_HERMES_ENDPOINT } from 'src/repositories/price/const.js';

// The addresses `builder.address.get` would return for the *current*
// deployment — distinct sentinels so a leak from the legacy context is
// unmistakable in a failing assertion.
const CURRENT_ADDR: Record<string, unknown> = {
  'core.packages.protocol.id': 'PKG',
  'core.market': 'MARKET',
  'core.version': 'VERSION',
  'core.coinDecimalsRegistry': 'REGISTRY',
  'core.oracles.xOracle': 'XORACLE',
  'referral.id': 'REFPKG',
  'core.packages.xOracle': { id: 'CURRENT_XORACLE_PKG' },
  'core.packages.xOracle.id': 'CURRENT_XORACLE_PKG',
  'core.oracles.pyth': { state: 'CURRENT_PYTH_STATE' },
  'core.oracles.pyth.state': 'CURRENT_PYTH_STATE',
};

const makeBuilder = () =>
  ({
    address: { get: (path: string) => CURRENT_ADDR[path] },
    moveCall: vi.fn(),
    utils: {
      logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
      parseCoinType: (n: string) => `0x2::${n}::T`,
      parseMarketCoinName: (n: string) => `s${n}`,
      parseSCoinName: (n: string) => `s${n}`,
    },
    suiKit: {},
    query: {
      getAssetOracles: vi.fn(),
      getObligations: vi.fn(),
      repos: { price: { indexerDataSource: {} } },
    },
    constants: { whitelist: { lending: ['sui'] } },
    usePythPullModel: false,
    useOnChainXOracleList: false,
    sponsoredFeeds: [],
    selectCoin: vi.fn(),
    selectSCoinOrMarketCoin: vi.fn(),
    pythEndpoint: 'CURRENT_ENDPOINT',
    pythApiKey: 'CURRENT_KEY',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const makeTxBlock = () =>
  ({
    sharedObjectRef: () => ({ tag: 'clock' }),
    txBlock: { object: { clock: () => 'CLOCK' } },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('newCoreTxBlock legacy oracle context', () => {
  it('legacyUpdateAssetPricesQuick resolves the legacy xOracle/pyth addresses', async () => {
    const coreTxBlock = newCoreTxBlock(makeBuilder(), makeTxBlock());
    await coreTxBlock.legacyUpdateAssetPricesQuick(['sui']);

    expect(updateOraclesMock).toHaveBeenCalledTimes(1);
    const ctx = updateOraclesMock.mock.calls[0][0];

    expect(ctx.address.get('core.packages.xOracle')).toEqual({
      id: '0xbf926dd6ecdd3bb5231659b739e20cf864dc12f13c5b4c8b939d00fa70350b3a',
      object:
        '0x897ebc619bdb4c3d9e8d86fb85b86cfd5d861b1696d26175c55ed14903a372f6',
      upgradeCap:
        '0x0f928a6b2e26b73330fecaf9b44acfc9800a4a9794d6415c2a3153bc70e3c1f0',
    });
    expect(ctx.address.get('core.packages.xOracle.id')).toBe(
      '0xbf926dd6ecdd3bb5231659b739e20cf864dc12f13c5b4c8b939d00fa70350b3a'
    );
    expect(ctx.address.get('core.oracles.pyth.state')).toBe(
      '0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8'
    );
    expect(ctx.ruleContext.pythEndpoint).toBe(LEGACY_PYTH_HERMES_ENDPOINT);
    expect(ctx.ruleContext.pythApiKey).toBe('');

    // Paths outside the two patched subtrees still fall through to `builder.address`.
    expect(ctx.address.get('core.oracles.xOracle')).toBe('XORACLE');
  });

  it('updateAssetPricesQuick (non-legacy) keeps using the current builder addresses', async () => {
    const coreTxBlock = newCoreTxBlock(makeBuilder(), makeTxBlock());
    await coreTxBlock.updateAssetPricesQuick(['sui']);

    expect(updateOraclesMock).toHaveBeenCalledTimes(1);
    const ctx = updateOraclesMock.mock.calls[0][0];

    expect(ctx.address.get('core.packages.xOracle')).toEqual({
      id: 'CURRENT_XORACLE_PKG',
    });
    expect(ctx.address.get('core.oracles.pyth.state')).toBe(
      'CURRENT_PYTH_STATE'
    );
    expect(ctx.ruleContext.pythEndpoint).toBe('CURRENT_ENDPOINT');
    expect(ctx.ruleContext.pythApiKey).toBe('CURRENT_KEY');
  });
});
