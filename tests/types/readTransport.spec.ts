import { describe, it, expectTypeOf } from 'vitest';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { ScallopQuery } from 'src/entries/index.js';
import { graphQLScallopSDK, scallopSDK } from '../scallopSdk.js';

// Compile-time assertions; validated by `pnpm test:typecheck` and run as no-ops.
describe('readTransport → coreClient derivation', () => {
  it('derives the concrete Core client from the configured transport', () => {
    expectTypeOf(scallopSDK.client.coreClient).toEqualTypeOf<SuiGrpcClient>();
    expectTypeOf(
      scallopSDK.client.builder.coreClient
    ).toEqualTypeOf<SuiGrpcClient>();
    expectTypeOf(
      scallopSDK.client.query.coreClient
    ).toEqualTypeOf<SuiGrpcClient>();

    expectTypeOf(
      graphQLScallopSDK.client.coreClient
    ).toEqualTypeOf<SuiGraphQLClient>();
    expectTypeOf(
      graphQLScallopSDK.client.query.coreClient
    ).toEqualTypeOf<SuiGraphQLClient>();
  });

  it('makes generic-signature Core methods callable without narrowing', () => {
    // Pre-generics this was TS2349: the union of two differing generic
    // `simulateTransaction` signatures had no callable overlap.
    expectTypeOf(
      scallopSDK.client.coreClient.simulateTransaction
    ).toBeCallableWith({ transaction: new Uint8Array() });
    expectTypeOf(
      graphQLScallopSDK.client.coreClient.simulateTransaction
    ).toBeCallableWith({ transaction: new Uint8Array() });
  });

  it('degrades to the union when the transport is not statically known', () => {
    expectTypeOf<
      ScallopQuery<'grpc' | 'graphql'>['coreClient']
    >().toEqualTypeOf<SuiGrpcClient | SuiGraphQLClient>();
  });
});
