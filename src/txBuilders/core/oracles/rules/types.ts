import type { TransactionArgument } from '@mysten/sui/transactions';
import type {
  SuiKit,
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import { Logger } from 'src/logger/Logger.js';
import type { IndexerDataSource } from 'src/datasources/indexer.js';
import type { ScallopAddress, ScallopBuilder } from 'src/models/index.js';
import type { SupportOracleType, xOracleRuleType } from 'src/types/index.js';

/**
 * Everything a single oracle rule needs, and nothing more.
 *
 * @description
 * Narrow context injected into every {@link OracleRule}. Exposes address reads,
 * the raw `moveCall` wrapper, a logger, and — for providers that fetch price data
 * off-chain before the tx (Pyth pull model) — the SuiKit handle plus resolved
 * endpoints. No full `ScallopBuilder`, mirroring `txBuilders/context.ts`.
 */
export type OracleRuleContext = {
  address: Pick<ScallopAddress, 'get'>;
  moveCall: ScallopBuilder['moveCall'];
  logger: Logger;
  // Pyth pull model only:
  suiKit: SuiKit;
  /** Preserves the legacy `builder.pythEndpoints ?? whitelist` resolution. */
  pythEndpoints: string[];
  fallbackPythEndpoints: string[];
  /** Pyth (Hermes) API access token; sent as `accessToken` when set. */
  pythApiKey?: string;
  /**
   * Scallop indexer datasource. Used by the pyth rule's keyless path to pull the
   * price-update payload (`/api/price/pyth`) when no `pythApiKey` is provided.
   */
  indexer: IndexerDataSource;
};

/** Args for a single `set_price` Move call, provider-agnostic. */
export type SetPriceParams = {
  txBlock: SuiKitTxBlock;
  ruleType: xOracleRuleType;
  /** The xOracle `price_update_request` hot potato. */
  request: TransactionArgument;
  assetCoinName: string;
  coinType: string;
};

/** Args for a provider's optional off-chain pre-tx step. */
export type PrepareParams = {
  txBlock: SuiKitTxBlock;
  /** Coins (using this provider) that are candidates for a feed update. */
  assetCoinNames: string[];
  usePythPullModel: boolean;
  sponsoredFeeds: ReadonlySet<string>;
  isSponsoredTx: boolean;
};

/**
 * One oracle provider (pyth / supra / switchboard). Each implementation reads
 * only its own addresses and knows only its own Move-call shape, so adding a
 * provider is a new class + one registry entry — no `if/else` dispatch, no
 * dumping every provider's ids into one call.
 */
export interface OracleRule {
  readonly type: SupportOracleType;

  /**
   * Optional off-chain pre-tx step: populate on-chain price data before the
   * `set_price` call runs (Pyth pull model VAAs). Called once per batch for the
   * coins that use this provider; no-op providers omit it.
   */
  prepare?(params: PrepareParams): Promise<void>;

  /** Append this provider's `set_price_as_<ruleType>` Move call onto the request. */
  setPrice(params: SetPriceParams): void;
}

/**
 * Shared scaffolding for the concrete rules: the clock ref, the default
 * `set_price_as_<ruleType>` target (Switchboard overrides), and the `setPrice`
 * template that frames every call as `[request, ...providerArgs, clock]`.
 */
export abstract class BaseOracleRule implements OracleRule {
  abstract readonly type: SupportOracleType;

  constructor(protected readonly ctx: OracleRuleContext) {}

  /** Package whose `rule` module exposes the set_price entry. */
  protected abstract packageId(): string;

  /** Move-call target. Pyth/Supra share this default; Switchboard overrides. */
  protected target(ruleType: xOracleRuleType): string {
    return `${this.packageId()}::rule::set_price_as_${ruleType}`;
  }

  /** Provider-specific object args, placed between `request` and the trailing clock. */
  protected abstract priceArgs(params: SetPriceParams): SuiObjectArg[];

  setPrice(params: SetPriceParams): void {
    const { txBlock, ruleType, request, coinType } = params;
    this.ctx.moveCall(
      txBlock,
      this.target(ruleType),
      [request, ...this.priceArgs(params), txBlock.txBlock.object.clock()],
      [coinType]
    );
  }
}
