import { describe, expect, it } from 'vitest';
import { toQuerySource } from './source.js';

describe('toQuerySource', () => {
  it('defaults to api-first when no flags are given', () => {
    // intent: dual-source domains should prefer the indexer with onchain fallback
    expect(toQuerySource()).toBe('api-first');
    expect(toQuerySource({})).toBe('api-first');
  });

  it('passes an explicit source through unchanged (highest precedence)', () => {
    expect(toQuerySource({ source: 'onchain' })).toBe('onchain');
    expect(toQuerySource({ source: 'api' })).toBe('api');
    // explicit source wins even if legacy flags disagree
    expect(toQuerySource({ source: 'onchain', indexer: true })).toBe('onchain');
  });

  it('maps the legacy useOnChainQuery boolean', () => {
    // intent: isIsolatedAsset(useOnChainQuery=true) must force onchain
    expect(toQuerySource({ useOnChainQuery: true })).toBe('onchain');
    expect(toQuerySource({ useOnChainQuery: false })).toBe('api-first');
  });

  it('maps the legacy indexer boolean', () => {
    expect(toQuerySource({ indexer: true })).toBe('api-first');
    expect(toQuerySource({ indexer: false })).toBe('onchain');
  });

  it('prefers useOnChainQuery over indexer when both are present', () => {
    expect(toQuerySource({ useOnChainQuery: true, indexer: true })).toBe(
      'onchain'
    );
  });
});
