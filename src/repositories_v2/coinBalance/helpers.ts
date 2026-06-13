import { CoinBalanceContext } from './types.js';
import { logError } from '../util.js';
import { normalizeStructTag } from '@mysten/sui/utils';
import { SuiClientTypes } from '@mysten/sui/client';
import { queryKeys } from 'src/constants/queryKeys.js';
import type { QueryClient } from '@tanstack/query-core';
import { getSharedObjectData } from 'src/utils/object.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { bcs } from '@mysten/sui/bcs';

const getUserBalanceFromOnChain = async (
  ctx: Pick<CoinBalanceContext, 'onchain'>,
  { address, coinType }: { address: string; coinType: string }
) => {
  const { onchain } = ctx;
  const result = await onchain.client.getBalance({
    owner: address,
    coinType,
  });

  return result.balance;
};

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
  ctx: Pick<CoinBalanceContext, 'onchain'> & {
    queryClient: QueryClient;
  },
  address: string
) => {
  const { onchain, queryClient } = ctx;
  const allBalances: SuiClientTypes.Balance[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await onchain.client.listBalances({
      owner: address,
      cursor,
      limit: 50,
    });
    allBalances.push(...(result.balances ?? []));
    hasNextPage = result.hasNextPage;
    cursor = result.cursor;
  }

  if (!allBalances.length) return {};

  const balances = allBalances.reduce(
    (acc, curr) => {
      if (curr.balance !== '0') {
        const coinType = normalizeStructTag(curr.coinType);
        acc[coinType] = curr;
        updateCachedBalance(queryClient, {
          balance: curr,
          coinType,
          address,
          node: onchain.url,
        });
      }
      return acc;
    },
    {} as Record<string, SuiClientTypes.Balance>
  );

  return balances;
};

export const getCoinAmountsFromOnChain = async (
  ctx: CoinBalanceContext,
  readArgs: {
    coinNames?: string[];
    address: string;
  }
) => {
  const { fetchWithCache, onchain, metadata, queryClient } = ctx;
  const { address, coinNames = [...metadata.whitelist.lending.values()] } =
    readArgs;

  const balances = await fetchWithCache({
    queryKey: queryKeys.rpc.getAllCoinBalances({
      node: onchain.url,
      activeAddress: address,
    }),
    queryFn: () =>
      getUserBalancesFromOnChain({ onchain, queryClient }, address),
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
  ctx: Pick<CoinBalanceContext, 'onchain' | 'fetchWithCache' | 'metadata'>,
  readArgs: {
    coinName: string;
    address: string;
  }
): Promise<number> => {
  const { fetchWithCache, onchain, metadata } = ctx;
  const { address, coinName } = readArgs;

  const coinType = metadata.parseCoinType(coinName);
  if (!coinType) return 0;

  const balance = await fetchWithCache({
    queryKey: queryKeys.rpc.getCoinBalance({
      node: onchain.url,
      address,
      coinType,
    }),
    queryFn: () =>
      getUserBalanceFromOnChain({ onchain }, { address, coinType }),
  });

  return Number(balance?.balance ?? 0);
};

export const getSCoinAmountsFromOnChain = async (
  ctx: CoinBalanceContext,
  readArgs: {
    sCoinNames?: string[];
    address: string;
  }
) => {
  const { fetchWithCache, onchain, metadata, queryClient } = ctx;
  const { address, sCoinNames = [...metadata.whitelist.scoin.values()] } =
    readArgs;

  const balances = await fetchWithCache({
    queryKey: queryKeys.rpc.getAllCoinBalances({
      node: onchain.url,
      activeAddress: address,
    }),
    queryFn: () =>
      getUserBalancesFromOnChain({ onchain, queryClient }, address),
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
  ctx: Pick<CoinBalanceContext, 'onchain' | 'fetchWithCache' | 'metadata'>,
  readArgs: {
    sCoinName: string;
    address: string;
  }
) => {
  const { fetchWithCache, onchain, metadata } = ctx;
  const { address, sCoinName } = readArgs;

  const sCoinType = metadata.parseSCoinType(sCoinName);
  if (!sCoinType) return 0;

  const balance = await fetchWithCache({
    queryKey: queryKeys.rpc.getCoinBalance({
      node: onchain.url,
      address,
      coinType: sCoinType,
    }),
    queryFn: () =>
      getUserBalanceFromOnChain({ onchain }, { address, coinType: sCoinType }),
  });

  return Number(balance?.balance ?? 0);
};

export const getMarketCoinAmountsFromOnChain = async (
  ctx: CoinBalanceContext,
  readArgs: {
    marketCoinNames?: string[];
    address: string;
  }
) => {
  const { fetchWithCache, onchain, metadata, queryClient } = ctx;
  const { address, marketCoinNames = [...metadata.whitelist.scoin.values()] } =
    readArgs;

  const balances = await fetchWithCache({
    queryKey: queryKeys.rpc.getAllCoinBalances({
      node: onchain.url,
      activeAddress: address,
    }),
    queryFn: () =>
      getUserBalancesFromOnChain({ onchain, queryClient }, address),
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

export const getMarketCoinAmount = async (
  ctx: Pick<CoinBalanceContext, 'onchain' | 'fetchWithCache' | 'metadata'>,
  readArgs: {
    marketCoinName: string;
    address: string;
  }
) => {
  const { fetchWithCache, onchain, metadata } = ctx;
  const { address, marketCoinName } = readArgs;

  const marketCoinType = metadata.parseMarketCoinType(marketCoinName);
  if (!marketCoinType) return 0;

  const balance = await fetchWithCache({
    queryKey: queryKeys.rpc.getCoinBalance({
      node: onchain.url,
      address,
      coinType: marketCoinType,
    }),
    queryFn: () =>
      getUserBalanceFromOnChain(
        { onchain },
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
      `Treasury address not found for sCoin: ${sCoinName}`
    );
  }

  const tx = new SuiTxBlock();
  const args = [
    await fetchWithCache({
      queryKey: queryKeys.rpc.getSharedObject({
        objectId: treasury,
        node: onchain.url,
      }),
      queryFn: () =>
        getSharedObjectData(onchain, {
          tx,
          objectId: treasury,
        }),
    }),
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
      `Failed to query total supply for ${sCoinName}: ${queryResults[queryResults.$kind]?.status.error?.message}`
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
