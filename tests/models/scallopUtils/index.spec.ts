import { describe, expect, it, vi } from 'vitest';
import ScallopUtils from 'src/models/scallopUtils/index.js';
import { MAINNET_GRAPHQL_URL } from 'src/datasources/graphql.js';

const coin = (objectId: string, balance: string) =>
  ({
    objectId,
    digest: `${objectId}-digest`,
    version: '1',
    balance,
  }) as never;

const createScallopUtilsWithCoins = (
  pages: { objects: never[]; hasNextPage: boolean; cursor: string | null }[]
) => {
  const listCoins = vi
    .fn()
    .mockImplementation(async () => pages.shift() ?? pages.at(-1));
  const utils = new ScallopUtils({
    walletAddress: '0xowner',
    scallopConstants: { queryClient: {} },
    // New-gen transport methods live on `suiClient.core`; the on-chain datasource
    // wraps `suiClient.core` (see wiring/datasources.ts).
    suiClient: { core: { listCoins } },
    fullnodeUrl: 'mock://node',
  } as never);
  return { utils, listCoins };
};

describe('ScallopUtils read transport selection', () => {
  const baseParams = {
    walletAddress: '0xowner',
    scallopConstants: { queryClient: {} },
    network: 'mainnet',
    fullnodeUrl: 'mock://grpc-node',
  } as never;

  it('defaults to the gRPC transport (onchain url = fullnodeUrl)', () => {
    const utils = new ScallopUtils(baseParams);
    expect(utils.onchain.url).toBe('mock://grpc-node');
  });

  it('builds a GraphQL read client when readTransport is "graphql"', () => {
    const utils = new ScallopUtils({
      ...(baseParams as object),
      readTransport: 'graphql',
    } as never);
    // The onchain datasource is namespaced by the GraphQL endpoint so its cache
    // keys never collide with the gRPC path.
    expect(utils.onchain.url).toBe(MAINNET_GRAPHQL_URL);
  });

  it('honors a custom graphqlUrl under the GraphQL transport', () => {
    const utils = new ScallopUtils({
      ...(baseParams as object),
      readTransport: 'graphql',
      graphqlUrl: 'mock://graphql-node',
    } as never);
    expect(utils.onchain.url).toBe('mock://graphql-node');
  });

  it('an injected graphqlClient alone does NOT flip the read transport', () => {
    const utils = new ScallopUtils({
      ...(baseParams as object),
      graphqlClient: { core: {} },
    } as never);
    // graphqlClient configures the balance datasource only; the read transport
    // stays gRPC unless readTransport: 'graphql' is set.
    expect(utils.onchain.url).toBe('mock://grpc-node');
  });
});

describe('ScallopUtils.selectCoins', () => {
  it('selects sorted coins until amount is covered', async () => {
    const { utils, listCoins } = createScallopUtilsWithCoins([
      {
        objects: [coin('0x2', '2'), coin('0x5', '5')],
        hasNextPage: false,
        cursor: null,
      },
    ]);

    const selected = await utils.selectCoins({
      amount: 6,
      coinType: '0x2::sui::SUI',
    });

    expect(selected.map((c) => c.objectId)).toEqual(['0x5', '0x2']);
    expect(listCoins).toHaveBeenCalledWith({
      owner: '0xowner',
      coinType: '0x2::sui::SUI',
      cursor: null,
    });
  });

  it('selects by coin object count across pages', async () => {
    const { utils } = createScallopUtilsWithCoins([
      {
        objects: [coin('0x2', '2'), coin('0x5', '5')],
        hasNextPage: true,
        cursor: 'cursor-1',
      },
      {
        objects: [coin('0x7', '7'), coin('0x1', '1')],
        hasNextPage: false,
        cursor: null,
      },
    ]);

    const selected = await utils.selectCoins({
      count: 3,
      coinType: '0x2::sui::SUI',
    });

    expect(selected.map((c) => c.objectId)).toEqual(['0x5', '0x2', '0x7']);
  });
});
