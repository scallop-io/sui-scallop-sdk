import { CoinBalanceContext } from './types.js';
import {
  logError,
  runWithDataSourceFallback,
  runByReadTransport,
} from '../utils.js';
import { ScallopRpcError, ScallopParseError } from 'src/errors/index.js';
import { normalizeStructTag } from '@mysten/sui/utils';
import { SuiClientTypes } from '@mysten/sui/client';
import { queryKeys } from 'src/constants/queryKeys.js';
import type { GrpcDataSource } from 'src/datasources/grpc.js';
import { getSharedObjectData } from 'src/utils/object.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { bcs } from '@mysten/sui/bcs';
import { BigNumber } from 'bignumber.js';

type BalanceSourcesCtx = Pick<
  CoinBalanceContext,
  'grpc' | 'balanceSource' | 'logger'
>;

const getUserBalanceFromOnChain = async (
  ctx: BalanceSourcesCtx,
  { address, coinType }: { address: string; coinType: string }
) => {
  const { grpc, logger } = ctx;
  const read = (src: GrpcDataSource) => async () =>
    (await src.client.getBalance({ owner: address, coinType })).balance;

  return runWithDataSourceFallback({
    source: 'onchain',
    // api: read(balanceSource),
    onchain: read(grpc),
    label: 'coinBalance:getBalance',
    logger,
  });
};

/**
 * Fetch balances for a KNOWN set of coin types in one round trip. Thin delegate
 * to the GraphQL datasource — the typed `multiGetBalances` query, its self-cache,
 * and rate-limiting all live in {@link GraphQLDataSource}. Returns a map keyed by
 * normalized coin type; types absent on-chain are omitted. GraphQL-only (gRPC has
 * no multi-coin balance call).
 */
export const getCoinBalancesFromGraphQL = (
  ctx: Pick<CoinBalanceContext, 'balanceSource'>,
  readArgs: {
    coinTypes: string[];
    address: string;
  }
): Promise<Record<string, SuiClientTypes.Balance>> =>
  ctx.balanceSource.multiGetBalances(readArgs.address, readArgs.coinTypes);

/**
 * Page every balance the address holds on a single transport, into a map keyed
 * by normalized coin type. gRPC fallback for {@link getAmountsByCoinType}.
 *
 * Includes a cursor-advance safety net: if the endpoint reports another page but
 * doesn't advance the cursor, stop. gRPC pages correctly; the `@mysten/sui`
 * GraphQL `listBalances` adapter ignores the cursor and would otherwise loop
 * forever (it just re-returns page one).
 */
const listAllBalancesAsMap = async (
  grpc: GrpcDataSource,
  address: string
): Promise<Record<string, SuiClientTypes.Balance>> => {
  const map: Record<string, SuiClientTypes.Balance> = {};
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await grpc.client.listBalances({
      owner: address,
      cursor,
      limit: 50,
    });
    for (const balance of result.balances ?? []) {
      map[normalizeStructTag(balance.coinType)] = balance;
    }
    const nextCursor = result.cursor;
    hasNextPage = result.hasNextPage;
    if (hasNextPage && (nextCursor == null || nextCursor === cursor)) break;
    cursor = nextCursor;
  }

  return map;
};

/**
 * The full gRPC wallet-balance scan, memoised under one stable key so concurrent
 * amount readers (`getCoinAmounts` / `getSCoinAmounts` / `getMarketCoinAmounts`)
 * for the same `node + address` share a SINGLE page sequence instead of each
 * re-scanning every balance. The network paging stays inside `queryFn` so
 * TanStack also dedupes in-flight callers, and the key is namespaced by the
 * fullnode url (a different node is a different snapshot).
 *
 * Mutations (supply/withdraw/…) that change wallet balances must invalidate the
 * `queryKeys.rpc.getAllCoinBalances` prefix alongside the existing per-coin
 * `getCoinBalance` keys, or a stale snapshot can survive a write.
 */
const getAllBalancesFromOnChain = (
  ctx: Pick<CoinBalanceContext, 'grpc' | 'fetchWithCache'>,
  address: string
): Promise<Record<string, SuiClientTypes.Balance>> =>
  ctx.fetchWithCache({
    queryKey: queryKeys.rpc.getAllCoinBalances({
      node: ctx.grpc.url,
      activeAddress: address,
    }),
    queryFn: () => listAllBalancesAsMap(ctx.grpc, address),
  });

/**
 * Resolve a `coinName → amount` dense map, reading balances strictly by
 * transport (no cross-transport fallback): on the GraphQL transport,
 * `multiGetBalances` for exactly the mapped coin types in ONE round trip; on the
 * gRPC transport, the shared `listBalances`-everything snapshot (then filter),
 * which is fresh right after a write. A transport error propagates. Names with
 * no coin type — or types absent on-chain — default to `0`, preserving the
 * legacy `getCoinAmounts` contract. Shared by the coin / sCoin / marketCoin
 * amount readers.
 */
const getAmountsByCoinType = async (
  ctx: Pick<
    CoinBalanceContext,
    'balanceSource' | 'grpc' | 'logger' | 'preferGraphql' | 'fetchWithCache'
  >,
  {
    address,
    coinTypeByName,
  }: {
    address: string;
    coinTypeByName: Record<string, string | undefined>;
  }
): Promise<Record<string, number>> => {
  const coinTypes = [
    ...new Set(Object.values(coinTypeByName).filter((t): t is string => !!t)),
  ];
  const balances = coinTypes.length
    ? await runByReadTransport({
        // Follow the selected read transport: GraphQL `multiGetBalances` on the
        // graphql transport, else the shared gRPC snapshot. That snapshot is
        // memoised for the 5s cache TTL (see `getAllBalancesFromOnChain`), so a
        // read within ~5s of a write can return a stale balance unless the
        // `getAllCoinBalances` prefix is invalidated.
        preferGraphql: ctx.preferGraphql,
        graphql: () => getCoinBalancesFromGraphQL(ctx, { address, coinTypes }),
        onchain: () => getAllBalancesFromOnChain(ctx, address),
        label: 'coinBalance:getCoinAmounts',
        logger: ctx.logger,
      })
    : {};

  return Object.entries(coinTypeByName).reduce(
    (acc, [coinName, coinType]) => {
      acc[coinName] = coinType
        ? Number(balances[normalizeStructTag(coinType)]?.balance ?? 0)
        : 0;
      return acc;
    },
    {} as Record<string, number>
  );
};

export const getCoinAmountsFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    | 'balanceSource'
    | 'metadata'
    | 'grpc'
    | 'logger'
    | 'preferGraphql'
    | 'fetchWithCache'
  >,
  readArgs: {
    coinNames?: string[];
    address: string;
  }
) => {
  const { metadata } = ctx;
  const { address, coinNames = [...metadata.whitelist.lending.values()] } =
    readArgs;

  return getAmountsByCoinType(ctx, {
    address,
    coinTypeByName: Object.fromEntries(
      coinNames.map((coinName) => [coinName, metadata.parseCoinType(coinName)])
    ),
  });
};

export const getCoinAmountFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    'grpc' | 'balanceSource' | 'logger' | 'fetchWithCache' | 'metadata'
  >,
  readArgs: {
    coinName: string;
    address: string;
  }
): Promise<number> => {
  const { fetchWithCache, grpc, balanceSource, logger, metadata } = ctx;
  const { address, coinName } = readArgs;

  const coinType = metadata.parseCoinType(coinName);
  if (!coinType) return 0;

  const balance = await fetchWithCache({
    queryKey: queryKeys.rpc.getCoinBalance({
      node: balanceSource.url,
      address,
      coinType,
    }),
    queryFn: () =>
      getUserBalanceFromOnChain(
        { grpc, balanceSource, logger },
        { address, coinType }
      ),
  });

  return Number(balance?.balance ?? 0);
};

export const getSCoinAmountsFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    | 'balanceSource'
    | 'metadata'
    | 'grpc'
    | 'logger'
    | 'preferGraphql'
    | 'fetchWithCache'
  >,
  readArgs: {
    sCoinNames?: string[];
    address: string;
  }
) => {
  const { metadata } = ctx;
  const { address, sCoinNames = [...metadata.whitelist.scoin.values()] } =
    readArgs;

  return getAmountsByCoinType(ctx, {
    address,
    coinTypeByName: Object.fromEntries(
      sCoinNames.map((sCoinName) => [
        sCoinName,
        metadata.parseSCoinType(sCoinName),
      ])
    ),
  });
};

export const getSCoinAmountFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    'grpc' | 'balanceSource' | 'logger' | 'fetchWithCache' | 'metadata'
  >,
  readArgs: {
    sCoinName: string;
    address: string;
  }
) => {
  const { fetchWithCache, grpc, balanceSource, logger, metadata } = ctx;
  const { address, sCoinName } = readArgs;

  const sCoinType = metadata.parseSCoinType(sCoinName);
  if (!sCoinType) return 0;

  const balance = await fetchWithCache({
    queryKey: queryKeys.rpc.getCoinBalance({
      node: balanceSource.url,
      address,
      coinType: sCoinType,
    }),
    queryFn: () =>
      getUserBalanceFromOnChain(
        { grpc, balanceSource, logger },
        { address, coinType: sCoinType }
      ),
  });

  return Number(balance?.balance ?? 0);
};

export const getMarketCoinAmountsFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    | 'balanceSource'
    | 'metadata'
    | 'grpc'
    | 'logger'
    | 'preferGraphql'
    | 'fetchWithCache'
  >,
  readArgs: {
    marketCoinNames?: string[];
    address: string;
  }
) => {
  const { metadata } = ctx;
  const { address, marketCoinNames = [...metadata.whitelist.scoin.values()] } =
    readArgs;

  return getAmountsByCoinType(ctx, {
    address,
    coinTypeByName: Object.fromEntries(
      marketCoinNames.map((marketCoinName) => [
        marketCoinName,
        metadata.parseMarketCoinType(marketCoinName),
      ])
    ),
  });
};

export const getMarketCoinAmountFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    'grpc' | 'balanceSource' | 'logger' | 'fetchWithCache' | 'metadata'
  >,
  readArgs: {
    marketCoinName: string;
    address: string;
  }
) => {
  const { fetchWithCache, grpc, balanceSource, logger, metadata } = ctx;
  const { address, marketCoinName } = readArgs;

  const marketCoinType = metadata.parseMarketCoinType(marketCoinName);
  if (!marketCoinType) return 0;

  const balance = await fetchWithCache({
    queryKey: queryKeys.rpc.getCoinBalance({
      node: balanceSource.url,
      address,
      coinType: marketCoinType,
    }),
    queryFn: () =>
      getUserBalanceFromOnChain(
        { grpc, balanceSource, logger },
        { address, coinType: marketCoinType }
      ),
  });

  return Number(balance?.balance ?? 0);
};

export const querySCoinTotalSupplyFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    'grpc' | 'fetchWithCache' | 'metadata' | 'logger'
  >,
  sCoinName: string
) => {
  const { grpc, metadata, fetchWithCache } = ctx;
  const {
    getCoinDecimal,
    parseSCoinType,
    parseUnderlyingSCoinType,
    parseCoinName,
    addresses: { scoin },
  } = metadata;

  const queryTarget = `${scoin.id}::s_coin_converter::total_supply`;
  const treasury = scoin.coins[sCoinName]?.treasury;
  if (!treasury) {
    throw logError(
      ctx.logger,
      new ScallopParseError(
        `Treasury address not found for sCoin: ${sCoinName}`,
        {
          context: { sCoinName },
        }
      )
    );
  }

  const tx = new SuiTxBlock();
  const treasuryObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({
      objectId: treasury,
      node: grpc.url,
    }),
    queryFn: () => grpc.getObject({ objectId: treasury }),
  });
  if (!treasuryObject.object) {
    throw logError(
      ctx.logger,
      new ScallopRpcError(`Failed to fetch treasury object ${treasury}`, {
        context: { treasury },
      })
    );
  }
  const args = [
    await getSharedObjectData(
      { grpc, fetchWithCache },
      {
        tx,
        objectId: treasuryObject.object,
      }
    ),
  ];
  const typeArgs = [
    parseSCoinType(sCoinName),
    parseUnderlyingSCoinType(sCoinName),
  ].filter((t): t is string => !!t);
  tx.moveCall(queryTarget, args, typeArgs);

  const include: Omit<
    SuiClientTypes.SimulateTransactionOptions<{
      commandResults: true;
    }>,
    'transaction'
  > = {
    include: {
      commandResults: true,
    },
  };

  const queryResults = await fetchWithCache({
    queryKey: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args,
      typeArgs,
      node: grpc.url,
      ...include,
    }),
    queryFn: () =>
      grpc.client.simulateTransaction<{ commandResults: true }>({
        ...include,
        transaction: tx.txBlock,
      }),
  });

  const commandResults = queryResults?.commandResults;
  if (!commandResults) {
    throw logError(
      ctx.logger,
      new ScallopRpcError(
        `Failed to query total supply for ${sCoinName}: ${queryResults[queryResults.$kind]?.status.error?.message}`,
        { context: { sCoinName } }
      )
    );
  }

  if (
    commandResults &&
    commandResults[0]?.returnValues &&
    commandResults[0].returnValues[0]
  ) {
    const value = commandResults[0].returnValues[0].bcs;
    const decimal = getCoinDecimal(parseCoinName(sCoinName) ?? '') ?? 0;
    return BigNumber(bcs.u64().parse(value)).shiftedBy(-decimal).toNumber();
  }

  return 0;
};
