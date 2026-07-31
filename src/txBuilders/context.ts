import type {
  SuiObjectArg,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import type { ScallopAddress, ScallopBuilder } from 'src/models/index.js';
import type { getObligationCoinNames } from './utils.js';

/**
 * Everything a PURE Move-call builder needs, nothing more.
 *
 * @description
 * Narrow context injected into {@link generateCoreNormalMethod}. It exposes only
 * address reads, coin-type parsing, and the raw `moveCall` wrapper — no query,
 * no coin selection, no suiKit.
 */
export type MoveCallContext = {
  address: Pick<ScallopAddress, 'get'>;
  moveCall: ScallopBuilder['moveCall'];
  // Pure parsing / metadata (coin-type, market/sCoin names, decimals, treasury,
  // …). It's the legitimate config dependency of a Move-call builder — but it is
  // deliberately I/O-free: no `query`, no coin selection, no `suiKit`. Those live
  // only in a domain's action context.
  utils: ScallopBuilder['utils'];
};

/**
 * The explicit orchestration toolkit a core quick method needs.
 *
 * @description
 * Narrow context injected into {@link generateCoreQuickMethod}. Built once from
 * `builder` in the factory and passed (instead of `builder`) into the quick
 * generator. Method signatures are taken via indexed-access types so they stay
 * in sync with `ScallopBuilder`.
 */
export type CoreActionContext = {
  reads: {
    getObligations: ScallopBuilder['query']['getObligations'];
    getObligationCoinNames: (
      obligationId: SuiObjectArg
    ) => ReturnType<typeof getObligationCoinNames>;
  };
  coins: {
    selectCoin: ScallopBuilder['selectCoin'];
    selectSCoinOrMarketCoin: ScallopBuilder['selectSCoinOrMarketCoin'];
  };
  oracles: {
    // @TODO: Temporary code, will be removed once those unsupported price feeds
    // are supported in the new Pyth Core.
    legacyUpdateOracles: (
      txBlock: SuiKitTxBlock,
      assetCoinNames?: string[],
      options?: {
        usePythPullModel?: boolean;
        useOnChainXOracleList?: boolean;
        sponsoredFeeds?: string[];
        isSponsoredTx?: boolean;
      }
    ) => Promise<void>;
    updateOracles: (
      txBlock: SuiKitTxBlock,
      assetCoinNames?: string[],
      options?: {
        usePythPullModel?: boolean;
        useOnChainXOracleList?: boolean;
        sponsoredFeeds?: string[];
        isSponsoredTx?: boolean;
      }
    ) => Promise<void>;
  };
  utils: {
    parseMarketCoinName: ScallopBuilder['utils']['parseMarketCoinName'];
    parseSCoinName: ScallopBuilder['utils']['parseSCoinName'];
  };
};
