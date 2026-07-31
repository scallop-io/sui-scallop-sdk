import type { TransactionArgument } from '@mysten/sui/transactions';
import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { xOracleList as X_ORACLE_LIST } from 'src/constants/index.js';
import { Logger } from 'src/logger/Logger.js';
import type { ScallopAddress, ScallopBuilder } from 'src/models/index.js';
import type { SupportOracleType, xOracleRuleType } from 'src/types/index.js';
import { buildOracleRuleRegistry } from './rules/registry.js';
import type { OracleRuleContext } from './rules/types.js';

/**
 * The toolkit `updateOracles` needs, and nothing more. Built once from `builder`
 * in `core/index.ts` and passed instead of the full builder — mirroring
 * `txBuilders/context.ts`.
 */
export type OracleActionContext = {
  /** Injected into every provider rule via the registry. */
  ruleContext: OracleRuleContext;
  address: Pick<ScallopAddress, 'get'>;
  moveCall: ScallopBuilder['moveCall'];
  parseCoinType: (assetCoinName: string) => string;
  getAssetOracles: ScallopBuilder['query']['getAssetOracles'];
  logger: Logger;
  defaults: {
    lendingWhitelist: string[];
    usePythPullModel: boolean;
    useOnChainXOracleList: boolean;
    sponsoredFeeds: string[];
  };
};

export type UpdateOraclesOptions = {
  usePythPullModel?: boolean;
  useOnChainXOracleList?: boolean;
  sponsoredFeeds?: string[];
  isSponsoredTx?: boolean;
};

/** xOracle `price_update_request` — opens the per-coin hot potato. */
const priceUpdateRequest = (
  ctx: OracleActionContext,
  txBlock: SuiKitTxBlock,
  coinType: string
): TransactionArgument => {
  return ctx.moveCall(
    txBlock,
    `${ctx.address.get('core.packages.xOracle.id')}::x_oracle::price_update_request`,
    [ctx.address.get('core.oracles.xOracle')],
    [coinType]
  ) as unknown as TransactionArgument;
};

/** xOracle `confirm_price_update_request` — closes the hot potato. */
const confirmPriceUpdateRequest = (
  ctx: OracleActionContext,
  txBlock: SuiKitTxBlock,
  request: TransactionArgument,
  coinType: string
): void => {
  ctx.moveCall(
    txBlock,
    `${ctx.address.get('core.packages.xOracle.id')}::x_oracle::confirm_price_update_request`,
    [
      ctx.address.get('core.oracles.xOracle'),
      request,
      txBlock.txBlock.object.clock(),
    ],
    [coinType]
  );
};

/**
 * Update the on-chain price of the given assets' oracles.
 *
 * @description
 * Provider-agnostic orchestrator: resolve the xOracle rule list, let each
 * provider run its optional off-chain prep once (Pyth pull), then per coin open
 * a `price_update_request`, dispatch `set_price` to each rule via the registry,
 * and confirm. No `if/else` per provider, no dumping every provider's ids into
 * one call — adding an oracle is a new rule class + registry entry.
 *
 * @param ctx - Narrow oracle action context (built from `builder`).
 * @param txBlock - TxBlock created by SuiKit.
 * @param assetCoinNames - Assets to update (defaults to the lending whitelist).
 * @param options - Overrides for pull-model / on-chain list / sponsorship.
 */
export const updateOracles = async (
  ctx: OracleActionContext,
  txBlock: SuiKitTxBlock,
  assetCoinNames: string[] = ctx.defaults.lendingWhitelist,
  options?: UpdateOraclesOptions
): Promise<void> => {
  const usePythPullModel =
    options?.usePythPullModel ?? ctx.defaults.usePythPullModel;
  const useOnChainXOracleList =
    options?.useOnChainXOracleList ?? ctx.defaults.useOnChainXOracleList;
  const isSponsoredTx = options?.isSponsoredTx ?? false;

  const lendingSet = new Set(ctx.defaults.lendingWhitelist);
  const sponsoredFeeds = new Set(
    (options?.sponsoredFeeds ?? ctx.defaults.sponsoredFeeds).filter((feed) => {
      if (!lendingSet.has(feed)) {
        ctx.logger.warn('sponsored feed not in lending whitelist; skipping', {
          feed,
        });
        return false;
      }
      return true;
    })
  );

  const xOracleList = useOnChainXOracleList
    ? await ctx.getAssetOracles()
    : X_ORACLE_LIST;

  const registry = buildOracleRuleRegistry(ctx.ruleContext);
  const updateAssetCoinNames = [...new Set(assetCoinNames)];

  // Group coins by provider so each provider's off-chain prep runs once.
  const providerCoins = new Map<SupportOracleType, string[]>();
  for (const coin of updateAssetCoinNames) {
    const rules = xOracleList[coin];
    if (!rules) continue;
    for (const provider of new Set([...rules.primary, ...rules.secondary])) {
      providerCoins.set(provider, [
        ...(providerCoins.get(provider) ?? []),
        coin,
      ]);
    }
  }
  // Sequential: prep mutates the single shared txBlock.
  for (const [provider, coins] of providerCoins) {
    await registry.get(provider)?.prepare?.({
      txBlock,
      assetCoinNames: coins,
      usePythPullModel,
      sponsoredFeeds,
      isSponsoredTx,
    });
  }

  for (const coin of updateAssetCoinNames) {
    const rules = xOracleList[coin];
    if (!rules) {
      ctx.logger.warn('no xOracle rule for asset; skipping price update', {
        coin,
      });
      continue;
    }
    const coinType = ctx.parseCoinType(coin);
    const request = priceUpdateRequest(ctx, txBlock, coinType);
    (['primary', 'secondary'] as xOracleRuleType[]).forEach((ruleType) => {
      for (const provider of rules[ruleType]) {
        registry.get(provider)?.setPrice({
          txBlock,
          ruleType,
          request,
          assetCoinName: coin,
          coinType,
        });
      }
    });
    confirmPriceUpdateRequest(ctx, txBlock, request, coinType);
  }
};
