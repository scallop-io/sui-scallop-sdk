import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PythOracleRule } from 'src/txBuilders/core/oracles/rules/pyth.js';
import { SupraOracleRule } from 'src/txBuilders/core/oracles/rules/supra.js';
import { SwitchboardOracleRule } from 'src/txBuilders/core/oracles/rules/switchboard.js';
import { CustomOracleRule } from 'src/txBuilders/core/oracles/rules/custom.js';
import { buildOracleRuleRegistry } from 'src/txBuilders/core/oracles/rules/registry.js';
import { ScallopTransactionBuildError } from 'src/errors/index.js';
import type { OracleRuleContext } from 'src/txBuilders/core/oracles/rules/types.js';

// address.get echoes the path so assertions can prove which address each rule
// reads. moveCall is a spy; sharedObjectRef returns a sentinel clock ref.
const makeCtx = () => {
  const moveCall = vi.fn();
  const ctx = {
    address: { get: (path: string) => path },
    moveCall,
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
  } as unknown as OracleRuleContext;
  return { ctx, moveCall };
};

// setPrice frames the trailing clock via `txBlock.txBlock.object.clock()`.
const txBlock = {
  txBlock: { object: { clock: () => 'CLOCK' } },
} as never;

const call = (rule: { setPrice: (p: never) => void }) =>
  rule.setPrice({
    txBlock,
    ruleType: 'primary',
    request: 'REQ',
    assetCoinName: 'sui',
    coinType: '0x2::sui::SUI',
  } as never);

describe('oracle rule strategies', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Pyth: set_price_as_<ruleType> with state + per-coin feed object + registry', () => {
    // intent: each provider reads ONLY its own addresses and frames [request, ...args, clock]
    const { ctx, moveCall } = makeCtx();
    call(new PythOracleRule(ctx));
    expect(moveCall).toHaveBeenCalledWith(
      txBlock,
      'core.packages.pyth.id::rule::set_price_as_primary',
      [
        'REQ',
        'core.oracles.pyth.state',
        'core.coins.sui.oracle.pyth.feedObject',
        'core.oracles.pyth.registry',
        'CLOCK',
      ],
      ['0x2::sui::SUI']
    );
  });

  it('Supra: set_price_as_<ruleType> with holder + registry', () => {
    const { ctx, moveCall } = makeCtx();
    call(new SupraOracleRule(ctx));
    expect(moveCall).toHaveBeenCalledWith(
      txBlock,
      'core.packages.supra.id::rule::set_price_as_primary',
      [
        'REQ',
        'core.oracles.supra.holder',
        'core.oracles.supra.registry',
        'CLOCK',
      ],
      ['0x2::sui::SUI']
    );
  });

  it('Switchboard: overrides target to set_as_<ruleType>_price with aggregator + registry', () => {
    // intent: the one provider whose target naming diverges must NOT use the default
    const { ctx, moveCall } = makeCtx();
    call(new SwitchboardOracleRule(ctx));
    expect(moveCall).toHaveBeenCalledWith(
      txBlock,
      'core.packages.switchboard.id::rule::set_as_primary_price',
      [
        'REQ',
        'core.coins.sui.oracle.switchboard',
        'core.oracles.switchboard.registry',
        'CLOCK',
      ],
      ['0x2::sui::SUI']
    );
  });

  it('Custom: set_price_as_<ruleType> with only the global registry', () => {
    // intent: the custom rule is coin-agnostic — it must NOT read any
    // `core.coins.*` feed metadata, only the one authorized registry.
    const { ctx, moveCall } = makeCtx();
    call(new CustomOracleRule(ctx));
    expect(moveCall).toHaveBeenCalledWith(
      txBlock,
      'core.packages.customOracle.id::rule::set_price_as_primary',
      ['REQ', 'core.oracles.custom.registry', 'CLOCK'],
      ['0x2::sui::SUI']
    );
  });

  it('Custom: throws a typed build error when its addresses are unconfigured', () => {
    // intent: `address.get` yields undefined for a missing path; without this
    // guard an unconfigured deployment silently builds `undefined::rule::...`.
    const { ctx, moveCall } = makeCtx();
    (ctx as { address: { get: (p: string) => unknown } }).address = {
      get: () => undefined,
    };
    expect(() => call(new CustomOracleRule(ctx))).toThrow(
      ScallopTransactionBuildError
    );
    expect(moveCall).not.toHaveBeenCalled();
  });

  it('registry exposes exactly the four providers keyed by oracle type', () => {
    const { ctx } = makeCtx();
    const registry = buildOracleRuleRegistry(ctx);
    expect([...registry.keys()].sort()).toEqual([
      'custom',
      'pyth',
      'supra',
      'switchboard',
    ]);
    expect(registry.get('pyth')?.type).toBe('pyth');
    expect(registry.get('switchboard')?.type).toBe('switchboard');
    expect(registry.get('custom')?.type).toBe('custom');
  });
});
