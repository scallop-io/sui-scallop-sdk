import { describe, expect, it } from 'vitest';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import ScallopQuery from 'src/models/scallopQuery/index.js';

// Construction is network-free: `initReadClients` builds lazy `SuiGrpcClient` /
// `SuiGraphQLClient` instances, and passing `scallopConstants` skips the API
// config fetch (that happens in `init()`, not the constructor).
const baseParams = {
  walletAddress: '0xowner',
  scallopConstants: { queryClient: {} },
  network: 'mainnet',
};

describe('ScallopQuery Core read-client wiring', () => {
  it('grpc transport: Core client is a SuiGrpcClient, and ScallopUtils holds that same client', () => {
    const query = new ScallopQuery({
      ...baseParams,
      fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
    } as never);
    expect(query.coreClient).toBeInstanceOf(SuiGrpcClient);
    // Regression guard (bug #2): ScallopUtils must hold the SAME client the
    // active transport selected, never a mismatched one — `selectCoins` calls
    // Core primitives (`listCoins`) directly on `utils.client`.
    expect(query.utils.client).toBe(query.coreClient);
  });

  it('graphql transport: Core reads run over the GraphQL client, and ScallopUtils holds that same client', () => {
    // Both `SuiGrpcClient` and `SuiGraphQLClient` implement the full Core
    // `TransportMethods` surface via `.core` (`ClientWithCoreApi`), so on the
    // graphql transport the Core read path is backed by the GraphQL client
    // itself, not a separate gRPC client (see llm-docs/REPO_GRAPHQL_SUPPORT.md).
    const query = new ScallopQuery({
      ...baseParams,
      readTransport: 'graphql',
      graphqlUrl: 'https://graphql.mainnet.sui.io/graphql',
    } as never);
    expect(query.coreClient).toBeInstanceOf(SuiGraphQLClient);
    // Regression guard (bug #2): ScallopUtils must hold the SAME client the
    // active transport selected, never a mismatched one.
    expect(query.utils.client).toBe(query.coreClient);
  });
});
