import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import type { ScallopBuilder } from 'src/models/index.js';
import type {
  SuiTxBlockWithCoreNormalMethods,
  CoreTxBlock,
  ScallopTxBlock,
  SuiTxBlockWithSpool,
} from 'src/types/index.js';
import { generateCoreNormalMethod } from './moveCalls.js';
import { generateCoreQuickMethod } from './quick.js';
import { updateOracles, type OracleActionContext } from './oracles/index.js';
import { getObligationCoinNames } from '../utils.js';
import type { CoreActionContext, MoveCallContext } from '../context.js';

/**
 * Create an enhanced transaction block instance for interaction with core modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop core txBlock.
 */
export const newCoreTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?:
    | ScallopTxBlock
    | SuiKitTxBlock
    | Transaction
    | SuiTxBlockWithSpool
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
        ? initTxBlock
        : new SuiKitTxBlock();

  // Build the narrow contexts once from `builder`, binding the closures.
  const moveCallContext: MoveCallContext = {
    address: builder.address,
    moveCall: builder.moveCall.bind(builder),
    utils: builder.utils,
  };

  const oracleContext: OracleActionContext = {
    ruleContext: {
      address: builder.address,
      moveCall: builder.moveCall.bind(builder),
      logger: builder.utils.logger,
      suiKit: builder.suiKit,
      // Preserve the legacy `builder.pythEndpoints ?? whitelist` resolution.
      // Guarded spread: the whitelist is read eagerly at construction (the old
      // code read it lazily in the pull path), so tolerate a missing list.
      pythEndpoints: builder.pythEndpoints,
      fallbackPythEndpoints: [
        ...(builder.constants.whitelist.pythEndpoints ?? []),
      ],
      pythApiKey: builder.pythApiKey,
      // Lazy: only the keyless Pyth pull path reads this, so defer resolution to
      // call time (mirrors `getAssetOracles`) instead of touching `query.repos`
      // at tx-block construction.
      get indexer() {
        return builder.query.repos.price.indexerDataSource;
      },
    },
    address: builder.address,
    moveCall: builder.moveCall.bind(builder),
    parseCoinType: (assetCoinName) =>
      builder.utils.parseCoinType(assetCoinName),
    getAssetOracles: () => builder.query.getAssetOracles(),
    logger: builder.utils.logger,
    defaults: {
      lendingWhitelist: [...builder.constants.whitelist.lending],
      usePythPullModel: builder.usePythPullModel,
      useOnChainXOracleList: builder.useOnChainXOracleList,
      sponsoredFeeds: builder.sponsoredFeeds,
    },
  };

  const actionContext: CoreActionContext = {
    reads: {
      getObligations: (ownerAddress) =>
        builder.query.getObligations(ownerAddress),
      getObligationCoinNames: (obligationId) =>
        getObligationCoinNames(builder, obligationId),
    },
    coins: {
      selectCoin: (...args) => builder.selectCoin(...args),
      selectSCoinOrMarketCoin: (...args) =>
        builder.selectSCoinOrMarketCoin(...args),
    },
    oracles: {
      updateOracles: (txBlock, assetCoinNames, options) =>
        updateOracles(oracleContext, txBlock, assetCoinNames, options),
    },
    utils: {
      parseMarketCoinName: (coinName) =>
        builder.utils.parseMarketCoinName(coinName),
      parseSCoinName: (coinName) => builder.utils.parseSCoinName(coinName),
    },
  };

  const normalMethod = generateCoreNormalMethod({
    ctx: moveCallContext,
    txBlock,
  });

  const normalTxBlock = new Proxy(txBlock, {
    get: (target, prop) => {
      if (prop in normalMethod) {
        return Reflect.get(normalMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as SuiTxBlockWithCoreNormalMethods;

  const quickMethod = generateCoreQuickMethod({
    ctx: actionContext,
    txBlock: normalTxBlock,
  });

  return new Proxy(normalTxBlock, {
    get: (target, prop) => {
      if (prop in quickMethod) {
        return Reflect.get(quickMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as CoreTxBlock;
};
