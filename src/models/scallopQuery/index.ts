import { SuiObjectArg } from '@scallop-io/sui-kit';
import { BigNumber } from 'bignumber.js';
import { ScallopParseError } from 'src/errors/index.js';
import { runWithDataSourceFallback } from 'src/repositories/utils.js';
import {
  createRepositories,
  type Repositories,
} from 'src/repositories/wiring/registry.js';
import type { QueryOptions } from 'src/repositories/wiring/source.js';
import {
  fromQueryOptions,
  toQuerySource,
} from 'src/repositories/wiring/source.js';
import {
  buildAllCoinPrices,
  buildLending,
  buildObligationAccount,
  buildUserPortfolio,
} from 'src/services/index.js';
import {
  CoinAmounts,
  CoinPrices,
  Lendings,
  MarketCollaterals,
  MarketPool,
  MarketPools,
  ObligationAccount,
  ObligationAccounts,
  StakePools,
  SuiObjectData,
  SuiObjectRef,
} from 'src/types/index.js';
import { ScallopQueryInterface } from '../interface.js';
import ScallopUtils from '../scallopUtils/index.js';
import { ScallopQueryConstructorParams } from './types.js';
import { pickRecord } from './utils.js';

export type {
  ScallopQueryConstructorParams,
  ScallopQueryConstructorParams as ScallopQueryParams,
} from './types.js';

class ScallopQuery implements ScallopQueryInterface {
  public readonly utils: ScallopUtils;
  public readonly repos: Repositories;

  constructor({
    utils,
    queryClient,
    queryClientConfig,
    priceTimeout,
    graphqlUrl,
    graphqlClient,
    pythApiKey,
    pythEndpoints,
    ...scallopUtilsArgs
  }: ScallopQueryConstructorParams) {
    // `graphqlUrl` / `graphqlClient` are destructured out for the registry
    // below, so re-supply them to `ScallopUtils` — the `readTransport: 'graphql'`
    // read-client branch needs them to honor a custom GraphQL endpoint/client.
    this.utils =
      utils ??
      new ScallopUtils({ ...scallopUtilsArgs, graphqlUrl, graphqlClient });
    this.repos = createRepositories({
      utils: this.utils,
      queryClient,
      queryClientConfig,
      priceTimeout,
      graphqlUrl,
      graphqlClient,
      pythApiKey,
      pythEndpoints,
      // Gates Tier-2 native GraphQL queries (preferGraphql) in the registry.
      readTransport: scallopUtilsArgs.readTransport,
    });
  }

  get logger() {
    return this.utils.logger;
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param force - Whether to force initialization.
   */
  async init(force: boolean = false) {
    await this.utils.init({ force });
  }

  get constants() {
    return this.utils.constants;
  }

  get walletAddress() {
    return this.utils.walletAddress;
  }

  get address() {
    return this.utils.address;
  }

  get onchain() {
    return this.utils.onchain;
  }

  /* ==================== Core Query Methods ==================== */

  /**
   * Shared market read: auto-fetch coin prices when the caller doesn't supply
   * them (otherwise every pool/collateral price would be 0), then delegate to
   * the market repository. Used by getMarketPools / getMarketCollaterals.
   */
  private async fetchMarkets(
    args?: QueryOptions & {
      coinPrices?: CoinPrices;
      poolCoinNames?: readonly string[];
      collateralCoinNames?: readonly string[];
    }
  ) {
    const priceCoinNames =
      args?.poolCoinNames || args?.collateralCoinNames
        ? Array.from(
            new Set([
              ...(args.poolCoinNames ?? []),
              ...(args.collateralCoinNames ?? []),
            ])
          )
        : undefined;
    const coinPrices =
      args?.coinPrices ??
      (await this.getPythCoinPrices({ coinNames: priceCoinNames })) ??
      {};
    return this.repos.market.getMarkets({
      coinPrices,
      poolCoinNames: args?.poolCoinNames,
      collateralCoinNames: args?.collateralCoinNames,
      source: fromQueryOptions(args),
    });
  }

  /**
   * Get market pools.
   *
   * @description
   * Fetches the full market once (pools + collaterals) and projects the result;
   * reuse the returned data rather than calling per-coin to reduce RPC load.
   *
   * @param poolCoinNames - Specific an array of support pool coin name.
   * @param indexer - Whether to use indexer.
   * @return Market pools data.
   */
  async getMarketPools(
    poolCoinNames: string[] = [...this.constants.whitelist.lending],
    args?: {
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    const { pools, collaterals } = await this.fetchMarkets({
      ...args,
      poolCoinNames,
      collateralCoinNames: poolCoinNames,
    });
    return {
      pools: pickRecord(pools, poolCoinNames),
      collaterals: pickRecord(collaterals, poolCoinNames),
    };
  }

  /**
   * Get  market pool
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param indexer - Whether to use indexer.
   * @return Market pool data.
   */
  async getMarketPool(
    poolCoinName: string,
    args?: {
      coinPrice?: number;
    } & QueryOptions
  ) {
    const marketPools = await this.getMarketPools(undefined, args);
    return marketPools.pools[poolCoinName];
  }

  /**
   * Get market collaterals.
   *
   * @description
   * Fetches the full market once (pools + collaterals) and projects the result;
   * reuse the returned data rather than calling per-coin to reduce RPC load.
   *
   * @param collateralCoinNames - Specific an array of support collateral coin name.
   * @param indexer - Whether to use indexer.
   * @return Market collaterals data.
   */
  async getMarketCollaterals(
    collateralCoinNames: string[] = [...this.constants.whitelist.collateral],
    args?: QueryOptions
  ) {
    const { collaterals } = await this.fetchMarkets({
      ...args,
      poolCoinNames: [],
      collateralCoinNames,
    });
    return pickRecord(collaterals, collateralCoinNames);
  }

  /**
   * Get market collateral
   *
   * @param collateralCoinName - Specific support collateral coin name.
   * @param indexer - Whether to use indexer.
   * @return Market collateral data.
   */
  async getMarketCollateral(collateralCoinName: string, args?: QueryOptions) {
    return (await this.getMarketCollaterals(undefined, args))[
      collateralCoinName
    ];
  }

  /**
   * Get obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data.
   */
  async getObligations(ownerAddress: string = this.walletAddress) {
    return this.repos.obligation.getObligations(ownerAddress);
  }

  /**
   * Get the on-chain names for an address's obligations.
   *
   * @param ownerAddress - The owner address.
   * @return A map of obligation id to its registered name (unnamed obligations are omitted).
   */
  async getObligationNames(ownerAddress: string = this.walletAddress) {
    return this.repos.obligation.getObligationNames(ownerAddress);
  }

  /**
   * Query obligation data.
   *
   * @param obligationId - The obligation id.
   * @return Obligation data.
   */
  async queryObligation(obligationId: SuiObjectArg) {
    const id =
      typeof obligationId === 'string'
        ? obligationId
        : 'objectId' in obligationId
          ? obligationId.objectId
          : undefined;
    if (id === undefined) {
      throw new ScallopParseError(
        'queryObligation expects an object id (string) or an object reference'
      );
    }
    return this.repos.obligation.getObligationData(id);
  }

  /**
   * Check whether an obligation is locked (bound to a borrow-incentive program).
   *
   * @param obligationId - The obligation id (string or object reference).
   * @return `true` when the obligation has a lock key, otherwise `false`.
   */
  async getObligationLocked(obligationId: SuiObjectArg) {
    const id =
      typeof obligationId === 'string'
        ? obligationId
        : 'objectId' in obligationId
          ? obligationId.objectId
          : undefined;
    if (id === undefined) {
      throw new ScallopParseError(
        'getObligationLocked expects an object id (string) or an object reference'
      );
    }
    return this.repos.obligation.getObligationLocked(id);
  }

  /**
   * Get all asset coin amounts.
   *
   * @param assetCoinNames - Specific an array of support asset coin name.
   * @param ownerAddress - The owner address.
   * @return All coin amounts.
   */
  async getCoinAmounts(
    assetCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    if (!ownerAddress) return {}; // Handle empty address
    return await this.repos.coinBalance.getCoinAmounts({
      coinNames: assetCoinNames,
      address: ownerAddress,
    });
  }

  /**
   * Get asset coin amount.
   *
   * @param assetCoinName - Specific support asset coin name.
   * @param ownerAddress - The owner address.
   * @return Coin amount.
   */
  async getCoinAmount(
    assetCoinName: string,
    ownerAddress: string = this.walletAddress
  ) {
    return await this.repos.coinBalance.getCoinAmount({
      coinName: assetCoinName,
      address: ownerAddress,
    });
  }

  /**
   * Get balances for a specific set of coin types in one GraphQL round trip
   * (`multiGetBalances`), instead of paging every balance. Returns a map keyed
   * by normalized coin type; types absent on-chain are omitted. GraphQL-only.
   *
   * @param coinTypes - Fully-qualified coin types to query.
   * @param ownerAddress - The owner address.
   * @return Map of normalized coin type to its `Balance`.
   */
  async getCoinBalances(
    coinTypes: string[],
    ownerAddress: string = this.walletAddress
  ) {
    if (!ownerAddress) return {}; // Handle empty address
    return await this.repos.coinBalance.getCoinBalances({
      coinTypes,
      address: ownerAddress,
    });
  }

  /**
   * Get all market coin amounts.
   *
   * @param coinNames - Specific an array of support market coin name.
   * @param ownerAddress - The owner address.
   * @return All market market coin amounts.
   */
  async getMarketCoinAmounts(
    marketCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    if (!ownerAddress) return {}; // Handle empty address
    // Preserve the legacy default set: lending whitelist mapped to market-coin
    // names (the repo's own default is the sCoin whitelist, a different set).
    const names =
      marketCoinNames ??
      [...this.constants.whitelist.lending].map((coinName) =>
        this.utils.parseMarketCoinName(coinName)
      );
    return await this.repos.coinBalance.getMarketCoinAmounts({
      marketCoinNames: names,
      address: ownerAddress,
    });
  }

  /**
   * Get market coin amount.
   *
   * @param coinNames - Specific support market coin name.
   * @param ownerAddress - The owner address.
   * @return Market market coin amount.
   */
  async getMarketCoinAmount(
    marketCoinName: string,
    ownerAddress: string = this.walletAddress
  ) {
    return await this.repos.coinBalance.getMarketCoinAmount({
      marketCoinName,
      address: ownerAddress,
    });
  }

  /* ==================== Spool Query Methods ==================== */

  /**
   * Get spools data.
   *
   * @param stakeMarketCoinNames - Specific an array of support stake market coin name.
   * @param indexer - Whether to use indexer.
   * @return Spools data.
   */
  async getSpools(
    stakeMarketCoinNames?: string[],
    args?: {
      marketPools?: MarketPools;
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    const coinPrices =
      args?.coinPrices ??
      (await this.getAllCoinPrices({ marketPools: args?.marketPools })) ??
      {};
    return this.repos.spool.getSpools({
      stakeCoinNames: stakeMarketCoinNames ?? [
        ...this.constants.whitelist.spool,
      ],
      coinPrices,
      source: fromQueryOptions(args),
    });
  }

  /**
   * Get spool data.
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @param indexer - Whether to use indexer.
   * @return Spool data.
   */
  async getSpool(
    stakeMarketCoinName: string,
    args?: {
      marketPool?: MarketPool;
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    const coinPrices =
      args?.coinPrices ?? (await this.getAllCoinPrices()) ?? {};
    return this.repos.spool.getSpool({
      stakeCoinName: stakeMarketCoinName,
      coinPrices,
      source: fromQueryOptions(args),
    });
  }

  /**
   * Get stake accounts data for all stake pools (spools).
   *
   * @param ownerAddress - The owner address.
   * @return All Stake accounts data.
   */
  async getAllStakeAccounts(ownerAddress: string = this.walletAddress) {
    if (!ownerAddress) return {}; // Handle empty address
    return await this.repos.spool.getStakeAccounts({ address: ownerAddress });
  }

  /**
   * Get stake accounts data for specific stake pool (spool).
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @param ownerAddress - The owner address.
   * @return Stake accounts data.
   */
  async getStakeAccounts(
    stakeMarketCoinName: string,
    ownerAddress: string = this.walletAddress
  ) {
    if (!ownerAddress) return []; // Handle empty address
    const allStakeAccount = await this.getAllStakeAccounts(ownerAddress);
    return allStakeAccount[stakeMarketCoinName] ?? [];
  }

  /**
   * Get stake pools (spools) data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpools` method
   * to get all spools data.
   *
   * @param stakeMarketCoinNames - Specific an array of support stake market coin name.
   * @return Stake pools data.
   */
  async getStakePools(
    stakeMarketCoinNames: string[] = [...this.constants.whitelist.spool]
  ) {
    const stakePools: StakePools = {};
    for (const stakeMarketCoinName of stakeMarketCoinNames) {
      const stakePool =
        await this.repos.spool.getStakePool(stakeMarketCoinName);

      if (stakePool) {
        stakePools[stakeMarketCoinName] = stakePool;
      }
    }

    return stakePools;
  }

  /**
   * Get stake pool (spool) data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpool` method
   * to get all spool data.
   *
   * @param stakeMarketCoinName - Specific support stake market coin name.
   * @return Stake pool data.
   */
  async getStakePool(stakeMarketCoinName: string) {
    return this.repos.spool.getStakePool(stakeMarketCoinName);
  }

  /**
   * Get stake reward pools data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpools` method
   * to get all spools data.
   *
   * @param stakeMarketCoinNames - Specific an array of stake market coin name.
   * @return Stake reward pools data.
   */
  async getStakeRewardPools(
    stakeMarketCoinNames: string[] = [...this.constants.whitelist.spool]
  ) {
    return this.repos.spool.getSpoolRewardPools(stakeMarketCoinNames);
  }

  /**
   * Get stake reward pool data.
   *
   * @description
   * For backward compatible, it is recommended to use `getSpool` method
   * to get spool data.
   *
   * @param marketCoinName - Specific support stake market coin name.
   * @return Stake reward pool data.
   */
  async getStakeRewardPool(stakeMarketCoinName: string) {
    return this.repos.spool.getSpoolRewardPool(stakeMarketCoinName);
  }

  async getPythCoinPrices(args?: { coinNames?: string[] }) {
    const coinNames =
      args?.coinNames ??
      Array.from(
        new Set([
          ...this.constants.whitelist.lending,
          ...this.constants.whitelist.collateral,
        ]).values()
      );

    return this.repos.price.getPricesFromPyth({
      coinNames,
      source: 'api-first',
    });
  }

  async getPythCoinPrice(coinName: string) {
    const prices = await this.getPythCoinPrices({ coinNames: [coinName] });
    return prices[coinName];
  }

  async getIndexerCoinPrices(args?: { coinNames?: string[] }) {
    const coinNames =
      args?.coinNames ??
      Array.from(
        new Set([
          ...this.constants.whitelist.lending,
          ...this.constants.whitelist.collateral,
        ]).values()
      );

    return this.repos.price.getPricesFromIndexer({
      coinNames,
    });
  }

  async getIndexerCoinPrice(coinName: string) {
    const prices = await this.getIndexerCoinPrices({ coinNames: [coinName] });
    return prices[coinName];
  }

  /**
   * Get borrow incentive pools data.
   *
   * @param coinNames - Specific an array of support borrow incentive coin name.
   * @param indexer - Whether to use indexer.
   * @return Borrow incentive pools data.
   */
  async getBorrowIncentivePools(
    coinNames: string[] = [...this.constants.whitelist.lending],
    args?: {
      coinPrices?: CoinPrices;
      marketPools?: MarketPools;
    } & QueryOptions
  ) {
    const coinPrices =
      args?.coinPrices ??
      (await this.getAllCoinPrices({ marketPools: args?.marketPools })) ??
      {};
    return this.repos.borrowIncentive.getBorrowIncentivePools({
      coinNames,
      coinPrices,
    });
  }

  /**
   * Get borrow incentive accounts data.
   *
   * @param coinNames - Specific support borrow incentive coin name.
   * @param ownerAddress - The owner address.
   * @return Borrow incentive accounts data.
   */
  async getBorrowIncentiveAccounts(
    obligationId: string | SuiObjectRef,
    coinNames: string[] = [...this.constants.whitelist.lending]
  ) {
    return await this.repos.borrowIncentive.getBorrowIncentiveAccounts({
      obligationId:
        typeof obligationId === 'string' ? obligationId : obligationId.objectId,
      coinNames,
    });
  }

  /**
   * Get user lending and spool infomation for specific pools.
   *
   * @param poolCoinNames - Specific an array of support pool coin name.
   * @param ownerAddress - The owner address.
   * @param indexer - Whether to use indexer.
   * @return All lending and spool infomation.
   */
  async getLendings(
    poolCoinNames?: string[],
    ownerAddress: string = this.walletAddress,
    args?: {
      marketPools?: MarketPools;
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    const names = poolCoinNames ?? [...this.constants.whitelist.lending];
    const marketCoinNames = names.map((n) => this.utils.parseMarketCoinName(n));
    const stakeMarketCoinNames = marketCoinNames.filter((n) =>
      this.constants.whitelist.spool.has(n)
    );

    const coinPrices =
      args?.coinPrices ??
      (await this.getPythCoinPrices({ coinNames: names })) ??
      {};

    const marketPools =
      args?.marketPools ??
      (await this.getMarketPools(names, { ...args, coinPrices })).pools;

    const spools = await this.getSpools(stakeMarketCoinNames, {
      ...args,
      marketPools,
      coinPrices,
    });

    const [coinAmounts, marketCoinAmounts, sCoinAmounts, allStakeAccounts] =
      await Promise.all([
        this.getCoinAmounts(names, ownerAddress),
        this.getMarketCoinAmounts(marketCoinNames, ownerAddress),
        this.getSCoinAmounts(marketCoinNames, ownerAddress),
        this.getAllStakeAccounts(ownerAddress),
      ]);

    const lendings: Lendings = {};
    for (const poolCoinName of names) {
      const marketCoinName = this.utils.parseMarketCoinName(poolCoinName);
      const isStake = stakeMarketCoinNames.includes(marketCoinName);
      lendings[poolCoinName] = buildLending({
        coinName: poolCoinName,
        symbol: this.utils.parseSymbol(poolCoinName),
        coinType: this.utils.parseCoinType(poolCoinName),
        marketCoinType: this.utils.parseMarketCoinType(poolCoinName),
        coinDecimal: this.utils.getCoinDecimal(poolCoinName) ?? 0,
        coinPrice: coinPrices[poolCoinName] ?? 0,
        marketPool: marketPools?.[poolCoinName],
        spool: isStake ? spools[marketCoinName] : undefined,
        stakeAccounts: isStake ? (allStakeAccounts[marketCoinName] ?? []) : [],
        coinAmount: coinAmounts[poolCoinName] ?? 0,
        marketCoinAmount: marketCoinAmounts[marketCoinName] ?? 0,
        sCoinAmount: sCoinAmounts[marketCoinName] ?? 0,
      });
    }
    return lendings;
  }

  /**
   * Get user lending and spool information for specific pool.
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param ownerAddress - The owner address.
   * @param indexer - Whether to use indexer.
   * @return Lending pool data.
   */
  async getLending(
    poolCoinName: string,
    ownerAddress: string = this.walletAddress,
    args?: QueryOptions
  ) {
    return (await this.getLendings([poolCoinName], ownerAddress, args))[
      poolCoinName
    ];
  }

  /**
   * Get user all obligation accounts information from ownerAddress.
   *
   * @description
   * All collateral and borrowing information in all obligation accounts owned by the user.
   *
   * @param ownerAddress - The owner address.
   * @param args - Additional arguments.
   * @return All obligation accounts information.
   */
  async getObligationAccounts(
    ownerAddress: string = this.walletAddress,
    args?: {
      market?: {
        collaterals: MarketCollaterals;
        pools: MarketPools;
      };
      coinPrices?: CoinPrices;
    } & QueryOptions
  ): Promise<ObligationAccounts> {
    if (!ownerAddress) return {}; // Handle empty address
    return runWithDataSourceFallback({
      source: fromQueryOptions(args),
      label: 'ScallopQuery.getObligationAccounts',
      logger: this.logger,
      api: () =>
        this.assembleObligationAccountsByOwner(ownerAddress, args, true),
      onchain: () =>
        this.assembleObligationAccountsByOwner(ownerAddress, args, false),
    });
  }

  /**
   * Get user all obligation accounts information from obligationIds.
   *
   * @description
   * All collateral and borrowing information in all obligation accounts.
   *
   * @param obligationIds - Obligation IDs.
   * @param args - Additional arguments.
   * @return All obligation accounts information.
   */
  async getObligationAccountsByIds(
    obligationIds: string[],
    args?: {
      market?: {
        collaterals: MarketCollaterals;
        pools: MarketPools;
      };
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    return runWithDataSourceFallback({
      source: fromQueryOptions(args),
      label: 'ScallopQuery.getObligationAccountsByIds',
      logger: this.logger,
      api: () =>
        this.assembleObligationAccountsByIds(obligationIds, args, true),
      onchain: () =>
        this.assembleObligationAccountsByIds(obligationIds, args, false),
    });
  }

  /**
   * Get obligation account by id
   *
   * @description
   * All collateral and borrowing information in obligation account.
   *
   * @param obligationId - Obligation ID.
   * @param args - Additional arguments.
   * @return All obligation accounts information.
   */
  async getObligationAccountById(
    obligationId: string,
    args?: {
      market?: {
        collaterals: MarketCollaterals;
        pools: MarketPools;
      };
      coinPrices?: CoinPrices;
    } & QueryOptions
  ) {
    return runWithDataSourceFallback({
      source: fromQueryOptions(args),
      label: 'ScallopQuery.getObligationAccountById',
      logger: this.logger,
      api: () => this.assembleObligationAccountById(obligationId, args, true),
      onchain: () =>
        this.assembleObligationAccountById(obligationId, args, false),
    });
  }

  /**
   * Fetch the shared market + price inputs an obligation-account assembly needs,
   * honouring caller-supplied overrides. `indexer` selects the market/price
   * source (the obligation's own collateral/debt data is always RPC).
   */
  private async resolveObligationMarketInputs(
    args:
      | ({
          market?: { collaterals: MarketCollaterals; pools: MarketPools };
          coinPrices?: CoinPrices;
        } & QueryOptions)
      | undefined,
    indexer: boolean
  ) {
    const market =
      args?.market ?? (await this.getMarketPools(undefined, { indexer }));
    const coinPrices =
      args?.coinPrices ??
      (await this.getAllCoinPrices({ marketPools: market.pools }));
    return { market, coinPrices };
  }

  /**
   * Assemble one obligation account: fetch its on-chain obligation data +
   * borrow-incentive pools/accounts, then hand everything to the pure
   * `buildObligationAccount`. Market/prices/coinAmounts are pre-fetched by the
   * caller and passed in.
   */
  private async assembleObligationAccount(
    obligation: string | SuiObjectRef | SuiObjectData,
    inputs: {
      market: { collaterals: MarketCollaterals; pools: MarketPools };
      coinPrices: CoinPrices;
      coinAmounts: CoinAmounts;
    },
    // When the caller batched the per-obligation devInspect queries up front
    // (many obligations → one `simulateTransaction`), it passes the results here
    // so this assembly reuses them instead of re-querying per obligation.
    prefetched?: {
      obligationQuery: Awaited<ReturnType<ScallopQuery['queryObligation']>>;
      borrowIncentiveAccounts: Awaited<
        ReturnType<ScallopQuery['getBorrowIncentiveAccounts']>
      >;
    }
  ): Promise<ObligationAccount> {
    const { market, coinPrices, coinAmounts } = inputs;
    const [obligationQuery, borrowIncentivePools, borrowIncentiveAccounts] =
      await Promise.all([
        prefetched
          ? Promise.resolve(prefetched.obligationQuery)
          : this.queryObligation(obligation),
        this.getBorrowIncentivePools(undefined, {
          coinPrices,
          marketPools: market.pools,
        }),
        prefetched
          ? Promise.resolve(prefetched.borrowIncentiveAccounts)
          : this.getBorrowIncentiveAccounts(obligation),
      ]);

    return buildObligationAccount({
      obligationId:
        typeof obligation === 'string' ? obligation : obligation.objectId,
      collateralCoinNames: Array.from(this.constants.whitelist.collateral),
      market,
      coinPrices,
      coinAmounts,
      obligationQuery,
      borrowIncentivePools,
      borrowIncentiveAccounts,
      utils: {
        parseCoinNameFromType: (type) => this.utils.parseCoinNameFromType(type),
        parseCoinType: (coinName) => this.utils.parseCoinType(coinName),
        parseSymbol: (coinName) => this.utils.parseSymbol(coinName),
        getCoinDecimal: (coinName) => this.utils.getCoinDecimal(coinName),
        parseSCoinTypeNameToMarketCoinName: (key) =>
          this.utils.parseSCoinTypeNameToMarketCoinName(key),
      },
    });
  }

  private async assembleObligationAccountsByOwner(
    ownerAddress: string,
    args:
      | ({
          market?: { collaterals: MarketCollaterals; pools: MarketPools };
          coinPrices?: CoinPrices;
        } & QueryOptions)
      | undefined,
    indexer: boolean
  ): Promise<ObligationAccounts> {
    const { market, coinPrices } = await this.resolveObligationMarketInputs(
      args,
      indexer
    );
    const [coinAmounts, obligations] = await Promise.all([
      this.getCoinAmounts(undefined, ownerAddress),
      this.getObligations(ownerAddress),
    ]);

    const obligationIds = obligations.map((obligation) => obligation.id);
    // Batch the per-obligation devInspect queries into one simulateTransaction
    // each (one moveCall per obligation) instead of N round-trips per query.
    const [obligationObjects, obligationDataMap, borrowIncentiveAccountsMap] =
      await Promise.all([
        this.repos.obligation.getObligationObjects(obligationIds),
        this.repos.obligation.getObligationsData(obligationIds),
        this.repos.borrowIncentive.getBorrowIncentiveAccountsBatch({
          obligationIds,
          coinNames: [...this.constants.whitelist.lending],
        }),
      ]);
    const obligationAccounts: ObligationAccounts = {};
    await Promise.allSettled(
      obligations.map(async (obligation, idx) => {
        obligationAccounts[obligation.keyId] =
          await this.assembleObligationAccount(
            obligationObjects[idx] ?? obligation.id,
            { market, coinPrices, coinAmounts },
            {
              obligationQuery: obligationDataMap[obligation.id],
              borrowIncentiveAccounts:
                borrowIncentiveAccountsMap[obligation.id] ?? {},
            }
          );
      })
    );
    return obligationAccounts;
  }

  private async assembleObligationAccountsByIds(
    obligationIds: string[],
    args:
      | ({
          market?: { collaterals: MarketCollaterals; pools: MarketPools };
          coinPrices?: CoinPrices;
        } & QueryOptions)
      | undefined,
    indexer: boolean
  ): Promise<ObligationAccount[]> {
    const { market, coinPrices } = await this.resolveObligationMarketInputs(
      args,
      indexer
    );
    // Batch the per-obligation devInspect queries up front (one
    // simulateTransaction each) so the loop below reuses the results.
    const [obligationDataMap, borrowIncentiveAccountsMap] = await Promise.all([
      this.repos.obligation.getObligationsData(obligationIds),
      this.repos.borrowIncentive.getBorrowIncentiveAccountsBatch({
        obligationIds,
        coinNames: [...this.constants.whitelist.lending],
      }),
    ]);
    const obligationAccounts: ObligationAccount[] = [];
    await Promise.allSettled(
      obligationIds.map(async (obligationId) => {
        const obligationAccount = await this.assembleObligationAccount(
          obligationId,
          { market, coinPrices, coinAmounts: {} },
          {
            obligationQuery: obligationDataMap[obligationId],
            borrowIncentiveAccounts:
              borrowIncentiveAccountsMap[obligationId] ?? {},
          }
        );
        if (obligationAccount) obligationAccounts.push(obligationAccount);
      })
    );
    return obligationAccounts;
  }

  private async assembleObligationAccountById(
    obligationId: string,
    args:
      | ({
          market?: { collaterals: MarketCollaterals; pools: MarketPools };
          coinPrices?: CoinPrices;
        } & QueryOptions)
      | undefined,
    indexer: boolean
  ): Promise<ObligationAccount> {
    const { market, coinPrices } = await this.resolveObligationMarketInputs(
      args,
      indexer
    );
    return this.assembleObligationAccount(obligationId, {
      market,
      coinPrices,
      coinAmounts: {},
    });
  }

  /**
   * Get obligation account information for specific id.
   *
   * @description
   * borrowing and obligation information for specific pool.
   *
   * @param obligationId - The obligation id.
   * @param ownerAddress - The owner address.
   * @param args - Additional arguments.
   * @return Borrowing and collateral information.
   */
  async getObligationAccount(
    obligationId: string,
    ownerAddress: string = this.walletAddress,
    args?: QueryOptions
  ) {
    const results = await this.getObligationAccounts(ownerAddress, args);
    return Object.values(results).find(
      (obligation) => obligation?.obligationId === obligationId
    );
  }

  /**
   * Get total value locked.
   *
   * @param indexer - Whether to use indexer.
   * @description
   * Include total supplied value and total borrowed value.
   *
   * @return Total value locked.
   */
  async getTvl(args?: QueryOptions) {
    const coinPrices = await this.getIndexerCoinPrices();
    return this.repos.market.getTvl({
      source: fromQueryOptions(args),
      coinPrices,
    });
  }

  /**
   * Get veSca data.
   * @param veScaKey
   * @returns veSca
   */
  async getVeSca(veScaKey: string | SuiObjectData) {
    return await this.repos.veSca.getVeSca(
      typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId
    );
  }

  /**
   * Get all veSca from walletAdddress
   * @param walletAddress
   * @returns array of veSca
   */
  async getVeScas({
    walletAddress = this.walletAddress,
    excludeEmpty = false,
  }: {
    walletAddress?: string;
    excludeEmpty?: boolean;
  } = {}) {
    if (!walletAddress) return []; // Handle empty address
    return await this.repos.veSca.getVeScasByAddress({
      address: walletAddress,
      excludeEmpty,
    });
  }

  /**
   * Get total vesca treasury with movecall
   * @returns Promise<string | undefined>
   */
  async getVeScaTreasuryInfo() {
    return await this.repos.veSca.getVeScaTreasuryInfo();
  }

  /**
   * Return binded referrer veScaKeyId of referee walletAddress if exist
   * @param walletAddress
   * @returns veScaKeyId
   */
  async getVeScaKeyIdFromReferralBindings(
    walletAddress: string = this.walletAddress
  ) {
    if (!walletAddress) return null; // Handle empty address
    return this.repos.referral.getVeScaKeyIdFromReferralBindings(walletAddress);
  }

  /**
   * Get the obligationId bound to a veScaKey if it exists.
   * @param veScaKey
   * @returns the bound obligationId, otherwise null
   */
  async getBindedObligation(veScaKey: string) {
    return this.repos.borrowIncentive.getBindedObligation(veScaKey);
  }

  /**
   * Get binded veSCA key from a obligationId if it exists.
   * @param obligationId
   * @returns veScaKey, otherwise null
   */
  async getBindedVeScaKey(obligationId: string) {
    return this.repos.borrowIncentive.getBindedVeScaKey(obligationId);
  }

  /**
   * Get user's veSCA loyalty program informations
   * @param veScaKey
   * @returns Loyalty program information
   */
  async getLoyaltyProgramInfos(veScaKey?: string | SuiObjectData) {
    // Cross-domain default: fall back to the wallet's primary veSca key.
    const key = veScaKey ?? (await this.getVeScas())[0]?.keyId;
    const keyId = typeof key === 'string' ? key : key?.objectId;
    return this.repos.loyaltyProgram.getLoyaltyProgramInfos(keyId);
  }

  /**
   * Get user's veSCA rewards informations from loyalty program
   * @param veScaKey
   * @returns Loyalty program information
   */
  async getVeScaLoyaltyProgramInfos(veScaKey: string) {
    return this.repos.veScaLoyaltyProgram.getVeScaLoyaltyProgramInfos(veScaKey);
  }

  /**
   * Get total supply of sCoin
   * @param sCoinName - Supported sCoin name
   * @returns Total Supply
   */
  async getSCoinTotalSupply(sCoinName: string) {
    return await this.repos.coinBalance.getSCoinTotalSupply(sCoinName);
  }

  /**
   * Get all sCoin amounts.
   *
   * @param sCoinNames - Specific an array of support sCoin name.
   * @param ownerAddress - The owner address.
   * @return All market sCoin amounts.
   */
  async getSCoinAmounts(
    sCoinNames?: string[],
    ownerAddress: string = this.walletAddress
  ) {
    if (!ownerAddress) return {}; // Handle empty address
    return await this.repos.coinBalance.getSCoinAmounts({
      sCoinNames,
      address: ownerAddress,
    });
  }

  /**
   * Get sCoin amount.
   *
   * @param coinNames - Specific support sCoin name.
   * @param ownerAddress - The owner address.
   * @return sCoin amount.
   */
  async getSCoinAmount(
    sCoinName: string | string,
    ownerAddress: string = this.walletAddress
  ) {
    const parsedSCoinName = this.utils.parseSCoinName(sCoinName);
    return parsedSCoinName
      ? await this.repos.coinBalance.getSCoinAmount({
          sCoinName: parsedSCoinName,
          address: ownerAddress,
        })
      : 0;
  }

  /**
   * Get swap rate from sCoin A to sCoin B
   * @param assetCoinNames
   * @returns
   */
  async getSCoinSwapRate(fromSCoin: string, toSCoin: string) {
    // Cross-domain: combines both pools' conversion rates with the underlying
    // price ratio. Orchestrated inline (no single repo owns it).
    if (fromSCoin === toSCoin) {
      throw new ScallopParseError('fromAsset and toAsset must be different');
    }
    if (!this.constants.whitelist.scoin.has(fromSCoin)) {
      throw new ScallopParseError('fromAsset is not supported');
    }
    if (!this.constants.whitelist.scoin.has(toSCoin)) {
      throw new ScallopParseError('toAsset is not supported');
    }

    const fromCoinName = this.utils.parseCoinName(fromSCoin);
    const toCoinName = this.utils.parseCoinName(toSCoin);

    const [fromPool, toPool] = await Promise.all([
      this.getMarketPool(fromCoinName),
      this.getMarketPool(toCoinName),
    ]);
    if (!fromPool || !toPool) {
      throw new ScallopParseError('Failed to fetch the lendings data');
    }
    if (fromPool.conversionRate === 0 || toPool.conversionRate === 0) {
      throw new ScallopParseError('Conversion rate cannot be zero');
    }

    const sCoinAToARate = fromPool.conversionRate;
    const bToSCoinBRate = 1 / toPool.conversionRate;

    let prices = await this.getPythCoinPrices();
    if (
      !prices[fromCoinName] ||
      !prices[toCoinName] ||
      prices[fromCoinName] === 0 ||
      prices[toCoinName] === 0
    ) {
      const indexerPrices = await this.getIndexerCoinPrices().catch(() => ({}));
      prices = { ...prices, ...indexerPrices };
    }
    if (!prices[fromCoinName] || !prices[toCoinName]) {
      throw new ScallopParseError('Failed to fetch the coin prices');
    }

    const aToBRate = prices[fromCoinName]! / prices[toCoinName]!;
    return BigNumber(sCoinAToARate)
      .multipliedBy(aToBRate)
      .multipliedBy(bToSCoinBRate)
      .toNumber();
  }

  /*
   * Get flashloan fee for specified assets
   */
  async getFlashLoanFees(
    assetCoinNames: string[] = [...this.constants.whitelist.lending]
  ) {
    return await this.repos.flashloan.getFlashloanFees(assetCoinNames);
  }

  /**
   * Get supply limit of lending pool
   */
  async getPoolSupplyLimit(poolName: string) {
    return this.repos.market.getPoolSupplyLimit(poolName);
  }

  /**
   * Get borrow limit of borrow pool
   */
  async getPoolBorrowLimit(poolName: string) {
    return this.repos.market.getPoolBorrowLimit(poolName);
  }

  /**
   * Get list of isolated assets
   */
  async getIsolatedAssets(useOnChainQuery: boolean = false) {
    return await this.repos.isolatedAssets.getIsolatedAssets({
      source: toQuerySource({ useOnChainQuery }),
    });
  }

  /**
   * Check if asset is an isolated asset
   */
  async isIsolatedAsset(
    assetCoinName: string,
    useOnChainQuery: boolean = false
  ) {
    // Fast-path: the cached pool address already carries the flag unless the
    // caller explicitly forces an on-chain read.
    const poolAddress = this.constants.poolAddresses[assetCoinName];
    if (poolAddress && !useOnChainQuery) {
      return poolAddress.isIsolated;
    }
    // Otherwise resolve from the on-chain isolated-asset set (coin types).
    const isolatedCoinTypes = await this.repos.isolatedAssets.getIsolatedAssets(
      {
        source: 'onchain',
      }
    );
    return isolatedCoinTypes.includes(this.utils.parseCoinType(assetCoinName));
  }

  /**
   * Get all coin prices, including sCoin.
   *
   * @description
   * Cross-domain: fetches base coin prices (indexer or pyth via utils) + market
   * pools, then derives sCoin prices from each pool's conversion rate
   * (`buildAllCoinPrices`). Orchestrated inline (no single repo owns it).
   *
   * @returns prices data
   */
  async getAllCoinPrices(args?: {
    marketPools?: MarketPools;
    coinPrices?: CoinPrices;
    indexer?: boolean;
  }) {
    const indexer = args?.indexer ?? false;
    const coinPrices =
      args?.coinPrices ??
      (indexer
        ? await this.getIndexerCoinPrices()
        : await this.getPythCoinPrices());
    const marketPools =
      args?.marketPools ??
      (await this.getMarketPools(undefined, { coinPrices, indexer })).pools;

    return buildAllCoinPrices({
      coinPrices,
      marketPools,
      sCoinNames: [...this.constants.whitelist.scoin],
      parseCoinName: (sCoinName) => this.utils.parseCoinName(sCoinName),
    });
  }

  /**
   * Query all address (lending pool, collateral pool, borrow dynamics, interest models, etc.) of all pool
   * @returns
   */
  async getPoolAddresses(apiAddressId = this.address.addressId) {
    if (!apiAddressId) {
      throw new ScallopParseError('apiAddressId is required');
    }
    // NOTE: `apiAddressId` no longer routes the fetch — the repo's API path uses
    // the fixed pool-addresses endpoint and the on-chain path rebuilds from the
    // current address config. The param is kept for signature compatibility.
    return this.repos.poolAddresses.getPoolAddresses({});
  }

  /**
   * Get user portfolio
   */
  async getUserPortfolio(args?: { walletAddress?: string; indexer?: boolean }) {
    const walletAddress = args?.walletAddress ?? this.walletAddress;
    if (!walletAddress) {
      throw new ScallopParseError('walletAddress is required');
    }
    const indexer = args?.indexer ?? false;

    const coinPrices = await this.getAllCoinPrices({ indexer });
    const market = await this.getMarketPools(undefined, {
      indexer,
      coinPrices,
    });

    const [lendings, obligationAccounts, veScas] = await Promise.all([
      this.getLendings(undefined, walletAddress, {
        indexer,
        marketPools: market.pools,
        coinPrices,
      }),
      this.getObligationAccounts(walletAddress, {
        indexer,
        market,
        coinPrices,
      }),
      this.getVeScas({ walletAddress, excludeEmpty: true }),
    ]);

    return buildUserPortfolio({
      lendings,
      obligationAccounts,
      veScas,
      coinPrices,
      marketPools: market.pools,
    });
  }

  /**
   * Get both primary and secondary price update policy objects
   * @returns price update policies
   */
  async getPriceUpdatePolicies() {
    return this.repos.xOracle.getPriceUpdatePolicies();
  }

  /**
   * Return the supported primary and secondary oracles for all supported pool assets
   * @returns
   */
  async getAssetOracles() {
    return this.repos.xOracle.getAssetOracles();
  }

  /**
   * Get switchboard on-demand aggregator object id based on coinType
   * @param coinType
   * @returns
   */
  async getSwitchboardOnDemandAggregatorObjectIds(coinName: string[]) {
    return this.repos.xOracle.getOnDemandAggObjectIds(coinName);
  }
}

export default ScallopQuery;
