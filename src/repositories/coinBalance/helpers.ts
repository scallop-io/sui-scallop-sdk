import { CoinBalanceContext } from './types.js';
import { logError, runWithDataSourceFallback } from '../utils.js';
import { ScallopRpcError, ScallopParseError } from 'src/errors/index.js';
import { normalizeStructTag } from '@mysten/sui/utils';
import { SuiClientTypes } from '@mysten/sui/client';
import { queryKeys } from 'src/constants/queryKeys.js';
import type { QueryClient } from '@tanstack/query-core';
import type { OnChainDataSource } from 'src/datasources/onchain.js';
import { getSharedObjectData } from 'src/utils/object.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { bcs } from '@mysten/sui/bcs';
import { BigNumber } from 'bignumber.js';

/**
 * Balance reads run GraphQL-first with a gRPC fallback: the gRPC balance service
 * flaps (see GRAPHQL_COINBALANCE_PLAN.md / misc/poc.ts), GraphQL is stable. Both
 * sources share the `OnChainDataSource` transport interface, so the same read
 * body runs against either.
 */
type BalanceSourcesCtx = Pick<
  CoinBalanceContext,
  'onchain' | 'balanceSource' | 'logger'
>;

const getUserBalanceFromOnChain = async (
  ctx: BalanceSourcesCtx,
  { address, coinType }: { address: string; coinType: string }
) => {
  const { onchain, logger } = ctx;
  const read = (src: OnChainDataSource) => async () =>
    (await src.client.getBalance({ owner: address, coinType })).balance;

  return runWithDataSourceFallback({
    source: 'onchain',
    // api: read(balanceSource),
    onchain: read(onchain),
    label: 'coinBalance:getBalance',
    logger,
  });
};

/**
 * Page through every balance for `address` on a single transport (gRPC fallback
 * path). NOTE: do NOT use this against the GraphQL `balanceSource` — the
 * `@mysten/sui` GraphQL `listBalances` adapter drops the cursor/limit (see
 * `graphql/core.mjs`), so it always returns the first page with `hasNextPage`
 * possibly `true`, which makes this loop spin forever. The GraphQL primary uses
 * {@link listAllBalancesViaGraphQL} instead, which paginates correctly.
 */
const listAllBalances = async (
  src: OnChainDataSource,
  address: string
): Promise<SuiClientTypes.Balance[]> => {
  const allBalances: SuiClientTypes.Balance[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await src.client.listBalances({
      owner: address,
      cursor,
      limit: 50,
    });
    allBalances.push(...(result.balances ?? []));
    hasNextPage = result.hasNextPage;
    cursor = result.cursor;
  }

  return allBalances;
};

// /**
//  * GraphQL-native paginated "list all balances". We issue the query ourselves
//  * (with `$cursor`/`$limit`) rather than going through `balanceSource.client.
//  * listBalances`, because that adapter ignores the cursor and can't advance past
//  * page one. Mapping mirrors the adapter's transport shape (`balance` = total,
//  * `coinBalance` = total − addressBalance).
//  */
// const ALL_BALANCES_QUERY = /* GraphQL */ `
//   query AllBalances($owner: SuiAddress!, $limit: Int, $cursor: String) {
//     address(address: $owner) {
//       balances(first: $limit, after: $cursor) {
//         pageInfo {
//           hasNextPage
//           endCursor
//         }
//         nodes {
//           coinType {
//             repr
//           }
//           coinBalance
//           totalBalance
//           addressBalance
//         }
//       }
//     }
//   }
// `;

// type AllBalancesResult = {
//   address: {
//     balances: {
//       pageInfo: { hasNextPage: boolean; endCursor: string | null };
//       nodes: {
//         coinType: { repr: string } | null;
//         coinBalance: string | null;
//         totalBalance: string | null;
//         addressBalance: string | null;
//       }[];
//     };
//   } | null;
// };

// type AllBalancesVariables = {
//   owner: string;
//   limit?: number | null;
//   cursor?: string | null;
// };

// const BALANCES_PAGE_LIMIT = 50;

// const listAllBalancesViaGraphQL = async (
//   graphqlClient: SuiGraphQLClient,
//   address: string
// ): Promise<SuiClientTypes.Balance[]> => {
//   const allBalances: SuiClientTypes.Balance[] = [];
//   let cursor: string | null = null;
//   let hasNextPage = true;

//   while (hasNextPage) {
//     const resp: GraphQLQueryResult<AllBalancesResult> =
//       await graphqlClient.query<AllBalancesResult, AllBalancesVariables>({
//         query: ALL_BALANCES_QUERY,
//         variables: { owner: address, limit: BALANCES_PAGE_LIMIT, cursor },
//       });
//     if (resp.errors?.length) {
//       // Fail loud → runWithDataSourceFallback drops to the gRPC lister.
//       throw new ScallopRpcError(
//         `GraphQL listBalances failed: ${resp.errors[0].message}`,
//         { context: { address } }
//       );
//     }

//     const connection = resp.data?.address?.balances;
//     if (!connection) break;

//     for (const node of connection.nodes) {
//       const coinType = node.coinType?.repr;
//       if (!coinType) continue;
//       const addressBalance = BigInt(node.addressBalance ?? '0');
//       const coinBalance = BigInt(node.coinBalance ?? '0');
//       allBalances.push({
//         coinType,
//         balance: node.totalBalance ?? '0',
//         coinBalance: coinBalance.toString(),
//         addressBalance: addressBalance.toString(),
//       });
//     }

//     hasNextPage = connection.pageInfo.hasNextPage;
//     cursor = connection.pageInfo.endCursor;
//     // Safety net: if the endpoint ever claims another page without advancing the
//     // cursor, stop instead of looping forever.
//     if (hasNextPage && !cursor) break;
//   }

//   return allBalances;
// };

const updateCachedBalance = (
  queryClient: QueryClient,
  {
    balance,
    coinType,
    address,
    node,
  }: {
    balance: SuiClientTypes.Balance;
    coinType: string;
    address: string;
    node: string;
  }
) => {
  const key = queryKeys.rpc.getCoinBalance({
    node,
    address,
    coinType,
  });

  queryClient.setQueryData<SuiClientTypes.Balance>(key, balance, {
    updatedAt: Date.now(),
  });
};

const getUserBalancesFromOnChain = async (
  ctx: BalanceSourcesCtx & {
    queryClient: QueryClient;
  },
  address: string
) => {
  const { onchain, balanceSource, logger, queryClient } = ctx;

  // GraphQL-first, gRPC fallback across the whole paged read. The GraphQL primary
  // paginates via its own cursor-aware query (the transport `listBalances`
  // adapter can't advance pages); on any failure we restart from the gRPC lister.
  const allBalances = await runWithDataSourceFallback({
    source: 'onchain',
    // api: () => listAllBalancesViaGraphQL(graphqlClient, address),
    onchain: () => listAllBalances(onchain, address),
    label: 'coinBalance:listBalances',
    logger,
  });

  if (!allBalances.length) return {};

  const balances = allBalances.reduce(
    (acc, curr) => {
      if (curr.balance !== '0') {
        const coinType = normalizeStructTag(curr.coinType);
        acc[coinType] = curr;
        // Cache per-coin entries under the canonical balance-source namespace so
        // a later single-coin read hits this cache (see the getCoinBalance keys
        // below, also keyed on balanceSource.url).
        updateCachedBalance(queryClient, {
          balance: curr,
          coinType,
          address,
          node: balanceSource.url,
        });
      }
      return acc;
    },
    {} as Record<string, SuiClientTypes.Balance>
  );

  return balances;
};

/**
 * Fetch balances for a KNOWN set of coin types in one round trip. Thin delegate
 * to the GraphQL datasource — the typed `multiGetBalances` query, its self-cache,
 * and rate-limiting all live in {@link GraphQLDataSource}. Returns a map keyed by
 * normalized coin type; types absent on-chain are omitted. GraphQL-only (gRPC has
 * no multi-coin balance call, so no fallback; callers wanting one use
 * getCoinAmounts).
 */
export const getCoinBalancesFromGraphQL = (
  ctx: Pick<CoinBalanceContext, 'balanceSource'>,
  readArgs: {
    coinTypes: string[];
    address: string;
  }
): Promise<Record<string, SuiClientTypes.Balance>> =>
  ctx.balanceSource.multiGetBalances(readArgs.address, readArgs.coinTypes);

export const getCoinAmountsFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    | 'onchain'
    | 'balanceSource'
    | 'logger'
    | 'fetchWithCache'
    | 'metadata'
    | 'queryClient'
  >,
  readArgs: {
    coinNames?: string[];
    address: string;
  }
) => {
  const {
    fetchWithCache,
    onchain,
    balanceSource,
    logger,
    metadata,
    queryClient,
  } = ctx;
  const { address, coinNames = [...metadata.whitelist.lending.values()] } =
    readArgs;

  const balances = await fetchWithCache({
    queryKey: queryKeys.rpc.getAllCoinBalances({
      node: balanceSource.url,
      activeAddress: address,
    }),
    queryFn: () =>
      getUserBalancesFromOnChain(
        { onchain, balanceSource, logger, queryClient },
        address
      ),
  });

  // Dense map: every requested coin is present, defaulting to 0 (matches the
  // legacy getCoinAmounts contract — number values, no dropped keys).
  const filteredBalances = coinNames.reduce(
    (acc, coinName) => {
      const coinType = metadata.parseCoinType(coinName);
      acc[coinName] = coinType ? Number(balances[coinType]?.balance ?? 0) : 0;
      return acc;
    },
    {} as Record<string, number>
  );

  return filteredBalances;
};

export const getCoinAmountFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    'onchain' | 'balanceSource' | 'logger' | 'fetchWithCache' | 'metadata'
  >,
  readArgs: {
    coinName: string;
    address: string;
  }
): Promise<number> => {
  const { fetchWithCache, onchain, balanceSource, logger, metadata } = ctx;
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
        { onchain, balanceSource, logger },
        { address, coinType }
      ),
  });

  return Number(balance?.balance ?? 0);
};

export const getSCoinAmountsFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    | 'onchain'
    | 'balanceSource'
    | 'logger'
    | 'fetchWithCache'
    | 'metadata'
    | 'queryClient'
  >,
  readArgs: {
    sCoinNames?: string[];
    address: string;
  }
) => {
  const {
    fetchWithCache,
    onchain,
    balanceSource,
    logger,
    metadata,
    queryClient,
  } = ctx;
  const { address, sCoinNames = [...metadata.whitelist.scoin.values()] } =
    readArgs;

  const balances = await fetchWithCache({
    queryKey: queryKeys.rpc.getAllCoinBalances({
      node: balanceSource.url,
      activeAddress: address,
    }),
    queryFn: () =>
      getUserBalancesFromOnChain(
        { onchain, balanceSource, logger, queryClient },
        address
      ),
  });

  const filteredBalances = sCoinNames.reduce(
    (acc, coinName) => {
      const sCoinType = metadata.parseSCoinType(coinName);
      acc[coinName] = sCoinType ? Number(balances[sCoinType]?.balance ?? 0) : 0;
      return acc;
    },
    {} as Record<string, number>
  );

  return filteredBalances;
};

export const getSCoinAmountFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    'onchain' | 'balanceSource' | 'logger' | 'fetchWithCache' | 'metadata'
  >,
  readArgs: {
    sCoinName: string;
    address: string;
  }
) => {
  const { fetchWithCache, onchain, balanceSource, logger, metadata } = ctx;
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
        { onchain, balanceSource, logger },
        { address, coinType: sCoinType }
      ),
  });

  return Number(balance?.balance ?? 0);
};

export const getMarketCoinAmountsFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    | 'onchain'
    | 'balanceSource'
    | 'logger'
    | 'fetchWithCache'
    | 'metadata'
    | 'queryClient'
  >,
  readArgs: {
    marketCoinNames?: string[];
    address: string;
  }
) => {
  const {
    fetchWithCache,
    onchain,
    balanceSource,
    logger,
    metadata,
    queryClient,
  } = ctx;
  const { address, marketCoinNames = [...metadata.whitelist.scoin.values()] } =
    readArgs;

  const balances = await fetchWithCache({
    queryKey: queryKeys.rpc.getAllCoinBalances({
      node: balanceSource.url,
      activeAddress: address,
    }),
    queryFn: () =>
      getUserBalancesFromOnChain(
        { onchain, balanceSource, logger, queryClient },
        address
      ),
  });

  const filteredBalances = marketCoinNames.reduce(
    (acc, coinName) => {
      const marketCoinType = metadata.parseMarketCoinType(coinName);
      acc[coinName] = marketCoinType
        ? Number(balances[marketCoinType]?.balance ?? 0)
        : 0;
      return acc;
    },
    {} as Record<string, number>
  );

  return filteredBalances;
};

export const getMarketCoinAmountFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    'onchain' | 'balanceSource' | 'logger' | 'fetchWithCache' | 'metadata'
  >,
  readArgs: {
    marketCoinName: string;
    address: string;
  }
) => {
  const { fetchWithCache, onchain, balanceSource, logger, metadata } = ctx;
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
        { onchain, balanceSource, logger },
        { address, coinType: marketCoinType }
      ),
  });

  return Number(balance?.balance ?? 0);
};

export const querySCoinTotalSupplyFromOnChain = async (
  ctx: Pick<
    CoinBalanceContext,
    'onchain' | 'fetchWithCache' | 'metadata' | 'logger'
  >,
  sCoinName: string
) => {
  const { onchain, metadata, fetchWithCache } = ctx;
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
      node: onchain.url,
    }),
    queryFn: () => onchain.getObject({ objectId: treasury }),
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
      { onchain, fetchWithCache },
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
      node: onchain.url,
      ...include,
    }),
    queryFn: () =>
      onchain.client.simulateTransaction<{ commandResults: true }>({
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
