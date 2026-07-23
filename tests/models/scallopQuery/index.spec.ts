import { describe, expect, it } from 'vitest';
import { SuiGrpcClient } from '@mysten/sui/grpc';
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
  it('grpc transport: ScallopUtils holds the gRPC Core client', () => {
    const query = new ScallopQuery({
      ...baseParams,
      fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
    } as never);
    expect(query.grpc).toBeInstanceOf(SuiGrpcClient);
    // The Core read path is always gRPC — `utils.client` is that same client.
    expect(query.utils.client).toBe(query.grpc);
  });

  it('graphql transport: ScallopUtils still holds the gRPC Core client, not the GraphQL client', () => {
    // Regression: `coreClient` used to be routed to the GraphQL client when
    // `readTransport: 'graphql'` (`readTransport === 'grpc' ? core : graphql`),
    // so `utils.client` became a `SuiGraphQLClient` with no `listCoins`. That
    // broke `selectCoins` — and therefore every write / *Quick flow — on the
    // graphql transport. The Core path is always gRPC regardless of transport.
    const query = new ScallopQuery({
      ...baseParams,
      readTransport: 'graphql',
      graphqlUrl: 'https://graphql.mainnet.sui.io/graphql',
    } as never);
    expect(query.grpc).toBeInstanceOf(SuiGrpcClient);
    expect(query.utils.client).toBe(query.grpc);
  });
});
