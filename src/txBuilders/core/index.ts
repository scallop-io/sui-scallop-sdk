import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import type { ReadTransport } from 'src/models/scallopQuery/types.js';
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
import { LEGACY_PYTH_HERMES_ENDPOINT } from 'src/repositories/price/const.js';
import type { ScallopAddress } from 'src/models/index.js';

// Patch core.packages.xOracle
const LEGACY_X_ORACLE = {
  xOracle: {
    id: '0xbf926dd6ecdd3bb5231659b739e20cf864dc12f13c5b4c8b939d00fa70350b3a',
    object:
      '0x897ebc619bdb4c3d9e8d86fb85b86cfd5d861b1696d26175c55ed14903a372f6',
    upgradeCap:
      '0x0f928a6b2e26b73330fecaf9b44acfc9800a4a9794d6415c2a3153bc70e3c1f0',
  },
};

// Patch core.oracles.pyth
const LEGACY_PYTH_ORACLE = {
  pyth: {
    registry:
      '0x352c9600e69ff6469f9fc7cd1d0cd5f88264caa5f8908102a223ce663fbb360c',
    registryCap:
      '0xe4995aaca4e70d4203790fbd22332107131e88b92b81bc976e6fc3a7d5005efd',
    state: '0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8',
    wormhole:
      '0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a',
    wormholeState:
      '0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c',
  },
};

// Patch core.coins.sca
const LEGACY_COIN = {
  sca: {
    id: '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6',
    metaData:
      '0x5d26a1e9a55c88147ac870bfa31b729d7f49f8804b8b3adfdf3582d301cca844',
    treasury: '',
    coinType:
      '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA',
    symbol: 'SCA',
    decimals: 9,
    oracle: {
      supra: '',
      switchboard: '',
      pyth: {
        feed: '7e17f0ac105abe9214deb9944c30264f5986bf292869c6bd8e8da3ccd92d79bc',
        feedObject:
          '0xf6de1d3279a269a597d813cbaca59aa906543ab9a8c64e84a4722f1a20863985',
      },
    },
  },
};

// Patch core.packages.pyth
const LEGACY_PYTH_ADAPTER_PACKAGE = {
  pyth: {
    id: '0x1cf913c825c202cbbb71c378edccb9c04723fa07a73b88677b2ef89c6e203a85',
    object:
      '0x1cf913c825c202cbbb71c378edccb9c04723fa07a73b88677b2ef89c6e203a85',
    upgradeCap:
      '0xb1f167889643ff766df31745b6e93b92462d8165b0a4f1b095499e15180370f7',
  },
};

/**
 * Create an enhanced transaction block instance for interaction with core modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop core txBlock.
 */
export const newCoreTxBlock = (
  builder: ScallopBuilder<ReadTransport>,
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

  // Patch `core.packages.xOracle` and `core.oracles.pyth` to the legacy
  // deployment addresses; everything else falls through to `builder.address`.
  const legacyAddress: Pick<ScallopAddress, 'get'> = {
    get: ((path: string) => {
      const overrides: Record<string, unknown> = {
        'core.packages.xOracle': LEGACY_X_ORACLE.xOracle,
        'core.oracles.pyth': LEGACY_PYTH_ORACLE.pyth,
        'core.coins.sca': LEGACY_COIN.sca,
        'core.packages.pyth': LEGACY_PYTH_ADAPTER_PACKAGE.pyth,
      };
      for (const [prefix, value] of Object.entries(overrides)) {
        if (path === prefix || path.startsWith(`${prefix}.`)) {
          const rest = path.slice(prefix.length + 1);
          return rest
            ? rest.split('.').reduce<any>((obj, key) => obj?.[key], value)
            : value;
        }
      }
      return builder.address.get(path as any);
    }) as ScallopAddress['get'],
  };

  const legacyOracleContext: OracleActionContext = {
    ruleContext: {
      address: legacyAddress,
      moveCall: builder.moveCall.bind(builder),
      logger: builder.utils.logger,
      suiKit: builder.suiKit,
      pythEndpoint: LEGACY_PYTH_HERMES_ENDPOINT,
      pythApiKey: '',
      // Lazy: only the keyless Pyth pull path reads this, so defer resolution to
      // call time (mirrors `getAssetOracles`) instead of touching `query.repos`
      // at tx-block construction.
      get indexer() {
        return builder.query.repos.price.indexerDataSource;
      },
    },
    address: legacyAddress,
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

  const oracleContext: OracleActionContext = {
    ruleContext: {
      address: builder.address,
      moveCall: builder.moveCall.bind(builder),
      logger: builder.utils.logger,
      suiKit: builder.suiKit,
      pythEndpoint: builder.pythEndpoint,
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
      legacyUpdateOracles: (txBlock, assetCoinNames, options) =>
        updateOracles(legacyOracleContext, txBlock, assetCoinNames, options),
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
