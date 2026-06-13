import {
  resolveQuerySource,
  runWithSourceFallback,
  type QueryOptions,
} from 'src/utils/index.js';
import {
  getObligations as getObligationsFn,
  queryObligation as queryObligationFn,
} from 'src/queries/coreQuery.js';
import {
  getObligationAccount as getObligationAccountFn,
  getObligationAccounts as getObligationAccountsFn,
  getObligationAccountsByIds as getObligationAccountsByIdsFn,
} from 'src/queries/portfolioQuery.js';
import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type {
  CoinPrices,
  MarketCollaterals,
  MarketPools,
} from 'src/types/index.js';
import type { Logger } from 'src/logger/index.js';
import type ScallopQuery from 'src/models/scallopQuery.js';

export type ObligationAccountsOptions = QueryOptions & {
  market?: {
    collaterals: MarketCollaterals;
    pools: MarketPools;
  };
  coinPrices?: CoinPrices;
};

export interface ObligationServiceParams {
  query: ScallopQuery;
  logger?: Logger;
}

/**
 * Centralises source selection + fallback for the read-side obligation API.
 *
 * `getObligations` and `queryObligation` are RPC-only (they query owned Sui
 * objects directly), so they ignore `QueryOptions.source`. The
 * `getObligationAccount*` methods take an optional source and route through
 * `runWithSourceFallback` to either the indexer or RPC branch of the
 * underlying free functions in `src/queries/portfolioQuery.ts`.
 *
 * The service calls the free query functions directly — not
 * `ScallopQuery.getObligationAccount(s)` — so it doesn't recurse when
 * `ScallopQuery` delegates here.
 */
export class ObligationService {
  private readonly query: ScallopQuery;
  private readonly logger?: Logger;

  constructor(params: ObligationServiceParams) {
    this.query = params.query;
    this.logger = params.logger ?? params.query.utils.logger;
  }

  async getObligations(ownerAddress: string) {
    return getObligationsFn(this.query, ownerAddress);
  }

  async queryObligation(obligationId: SuiObjectArg) {
    return queryObligationFn(this.query, obligationId);
  }

  async getObligationAccounts(
    ownerAddress: string,
    options?: ObligationAccountsOptions
  ) {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'ObligationService.getObligationAccounts',
      logger: this.logger,
      indexer: () =>
        getObligationAccountsFn(
          this.query,
          ownerAddress,
          options?.market,
          options?.coinPrices,
          true
        ),
      rpc: () =>
        getObligationAccountsFn(
          this.query,
          ownerAddress,
          options?.market,
          options?.coinPrices,
          false
        ),
    });
  }

  async getObligationAccountsByIds(
    obligationIds: string[],
    options?: ObligationAccountsOptions
  ) {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'ObligationService.getObligationAccountsByIds',
      logger: this.logger,
      indexer: () =>
        getObligationAccountsByIdsFn(
          this.query,
          obligationIds,
          options?.market,
          options?.coinPrices,
          true
        ),
      rpc: () =>
        getObligationAccountsByIdsFn(
          this.query,
          obligationIds,
          options?.market,
          options?.coinPrices,
          false
        ),
    });
  }

  async getObligationAccountById(
    obligationId: string,
    options?: ObligationAccountsOptions
  ) {
    const source = resolveQuerySource(options);
    return runWithSourceFallback({
      source,
      label: 'ObligationService.getObligationAccountById',
      logger: this.logger,
      indexer: () =>
        getObligationAccountFn(
          this.query,
          obligationId,
          '',
          true,
          options?.market,
          options?.coinPrices,
          {}
        ),
      rpc: () =>
        getObligationAccountFn(
          this.query,
          obligationId,
          '',
          false,
          options?.market,
          options?.coinPrices,
          {}
        ),
    });
  }
}
