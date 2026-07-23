import { describe, expect, it, vi } from 'vitest';
import ScallopUtils from 'src/models/scallopUtils/index.js';

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
    // ScallopUtils now receives the resolved Core read client directly as
    // `coreClient` (selection happens upstream in ScallopQuery). `selectCoins`
    // reads `this.client.listCoins`.
    coreClient: { listCoins },
    fullnodeUrl: 'mock://node',
  } as never);
  return { utils, listCoins };
};

// NOTE: read-transport selection is no longer a ScallopUtils responsibility —
// it moved to `ScallopQuery.initReadClients` (grpc/graphql client routing),
// which currently has no dedicated test. The old
// `describe('ScallopUtils read transport selection')` block was removed here as
// it asserted the removed `utils.grpc` surface.

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
