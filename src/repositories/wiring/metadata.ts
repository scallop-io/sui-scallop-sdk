import type ScallopUtils from 'src/models/scallopUtils.js';
import type {
  MarketRepoAddressConfig,
  MarketRepoMetadata,
} from '../market/types.js';
import type { CoinBalanceMetadata } from '../coinBalance/types.js';
import type { FlashloanMetadata } from '../flashloan/types.js';
import type { ObligationRepoMetadata } from '../obligation/types.js';
import type { BorrowIncentiveMetadata } from '../borrowIncentive/types.js';
import type { ReferralRepoMetadata } from '../referral/types.js';
import type { PriceRepositoryMetadata } from '../price/types.js';
import type { PoolAddressesRepoMetadata } from '../poolAddresses/types.js';
import type { IsolatedAssetsMetadata } from '../isolatedAssets/types.js';
import type { VeScaRepoMetadata } from '../veSca/types.js';
import type { LoyaltyProgramRepoMetadata } from '../loyaltyProgram/types.js';
import type { VeScaLoyaltyProgramRepoMetadata } from '../veScaLoyaltyProgram/types.js';
import type { XOracleMetadata } from '../xOracle/types.js';
import type { SpoolMetadata } from '../spool/types.js';
import { SUPPORTED_ORACLES } from '../xOracle/const.js';
import { ScallopConfigError } from 'src/errors/index.js';

/**
 * The ONE seam between the SDK models (`ScallopUtils` / `ScallopConstants`) and
 * the pure repositories layer. Each `buildXMetadata` is a pure function that
 * projects the model surface into the plain data + bound helper functions a repo
 * expects. Repos never import the models — everything they need flows through here.
 *
 * Helpers are arrow-wrapped (not passed by reference) so they keep ScallopUtils'
 * `this` binding. Address ids come from `utils.address.get(path)` — paths mirror
 * the ones the old query layer used.
 */

export const buildMarketMetadata = (
  utils: ScallopUtils
): MarketRepoMetadata => ({
  whitelist: {
    lending: utils.constants.whitelist.lending,
    collateral: utils.constants.whitelist.collateral,
  },
  poolAddresses: utils.constants.poolAddresses,
  parseCoinNameFromType: (coinType) => utils.parseCoinNameFromType(coinType),
  parseCoinType: (coinName) => utils.parseCoinType(coinName),
  parseSymbol: (coinName) => utils.parseSymbol(coinName),
  parseMarketCoinType: (coinName) => utils.parseMarketCoinType(coinName),
  parseMarketCoinName: (coinName) => utils.parseMarketCoinName(coinName),
  parseSCoinType: (sCoinName) => utils.parseSCoinType(sCoinName),
  getCoinWrappedType: (coinName) => utils.getCoinWrappedType(coinName),
  getCoinDecimal: (coinName) => utils.getCoinDecimal(coinName),
  parseAprToApy: (apr) => utils.parseAprToApy(apr),
});

export const buildMarketAddresses = (
  utils: ScallopUtils
): MarketRepoAddressConfig => ({
  queryPackageId: utils.address.get('core.packages.query.id'),
  market: utils.address.get('core.market'),
});

export const buildCoinBalanceMetadata = (
  utils: ScallopUtils
): CoinBalanceMetadata => {
  const addresses = utils.address.getAddresses();
  if (!addresses) {
    throw new ScallopConfigError(
      'Addresses are not initialized; call init() before building repositories'
    );
  }
  return {
    whitelist: {
      lending: utils.constants.whitelist.lending,
      scoin: utils.constants.whitelist.scoin,
    },
    addresses: {
      scoin: addresses.scoin,
    },
    parseCoinType: (coinName) => utils.parseCoinType(coinName),
    parseSCoinType: (sCoinName) => utils.parseSCoinType(sCoinName),
    parseMarketCoinType: (coinName) => utils.parseMarketCoinType(coinName),
    parseSCoinNameFromType: (sCoinType) =>
      utils.parseSCoinNameFromType(sCoinType),
    parseUnderlyingSCoinType: (sCoinName) =>
      utils.parseUnderlyingSCoinType(sCoinName),
    getSCoinTreasury: (sCoinName) => utils.getSCoinTreasury(sCoinName),
    getCoinDecimal: (coinName) => utils.getCoinDecimal(coinName),
    parseCoinName: (marketCoinName) => utils.parseCoinName(marketCoinName),
  };
};

export const buildFlashloanMetadata = (
  utils: ScallopUtils
): FlashloanMetadata => {
  const entries = Object.entries(utils.constants.coinTypeToCoinNameMap).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  );
  return { coinTypeToCoinNameMap: new Map(entries) };
};

export const buildObligationMetadata = (
  utils: ScallopUtils
): ObligationRepoMetadata => ({
  addresses: {
    protocolObjectId: utils.address.get('core.object'),
    queryPackageId: utils.address.get('core.packages.query.id'),
    version: utils.address.get('core.version'),
    market: utils.address.get('core.market'),
  },
});

export const buildBorrowIncentiveMetadata = (
  utils: ScallopUtils
): BorrowIncentiveMetadata => {
  const addresses = utils.address.getAddresses();
  if (!addresses) {
    throw new ScallopConfigError(
      'Addresses are not initialized; call init() before building repositories'
    );
  }
  return {
    whitelist: { lending: utils.constants.whitelist.lending },
    addresses: {
      borrowIncentive: addresses.borrowIncentive,
      core: { object: utils.address.get('core.object') },
      vesca: { object: utils.address.get('vesca.object') },
    },
    parseCoinNameFromType: (coinType) => utils.parseCoinNameFromType(coinType),
    parseSymbol: (coinName) => utils.parseSymbol(coinName),
    getCoinDecimal: (coinName) => utils.getCoinDecimal(coinName),
  };
};

export const buildReferralMetadata = (
  utils: ScallopUtils
): ReferralRepoMetadata => ({
  addresses: {
    referral: {
      bindingTableId: utils.address.get('referral.bindingTableId'),
    },
  },
});

export const buildPriceMetadata = (
  utils: ScallopUtils
): PriceRepositoryMetadata => {
  const addresses = utils.address.getAddresses();
  if (!addresses) {
    throw new ScallopConfigError(
      'Addresses are not initialized; call init() before building repositories'
    );
  }
  // Keep only present coins (drop undefined entries) to satisfy the repo's
  // dense `core.coins` contract.
  const coins = Object.fromEntries(
    Object.entries(addresses.core.coins).filter(
      (entry): entry is [string, NonNullable<(typeof entry)[1]>] =>
        entry[1] !== undefined
    )
  );
  return { addresses: { coins } };
};

export const buildPoolAddressesMetadata = (
  utils: ScallopUtils
): PoolAddressesRepoMetadata => {
  const addresses = utils.address.getAddresses();
  if (!addresses) {
    throw new ScallopConfigError(
      'Addresses are not initialized; call init() before building repositories'
    );
  }
  return {
    addresses: {
      core: { coins: addresses.core.coins, market: addresses.core.market },
      spool: { pools: addresses.spool.pools },
      scoin: { coins: addresses.scoin.coins },
    },
  };
};

export const buildIsolatedAssetsMetadata = (
  utils: ScallopUtils
): IsolatedAssetsMetadata => ({
  addresses: { market: utils.address.get('core.market') },
  poolAddresses: utils.constants.poolAddresses,
  whitelist: { lending: utils.constants.whitelist.lending },
});

export const buildVeScaMetadata = (utils: ScallopUtils): VeScaRepoMetadata => ({
  addresses: {
    veSca: {
      id: utils.address.get('vesca.id'),
      config: utils.address.get('vesca.config'),
      tableId: utils.address.get('vesca.tableId'),
      object: utils.address.get('vesca.object'),
      treasury: utils.address.get('vesca.treasury'),
    },
  },
});

export const buildLoyaltyProgramMetadata = (
  utils: ScallopUtils
): LoyaltyProgramRepoMetadata => ({
  addresses: {
    loyaltyProgram: {
      rewardPool: utils.address.get('loyaltyProgram.rewardPool'),
    },
  },
});

export const buildVeScaLoyaltyProgramMetadata = (
  utils: ScallopUtils
): VeScaLoyaltyProgramRepoMetadata => {
  const addresses = utils.address.getAddresses();
  if (!addresses) {
    throw new ScallopConfigError(
      'Addresses are not initialized; call init() before building repositories'
    );
  }
  return {
    addresses: {
      veSca: { tableId: addresses.vesca.tableId },
      veScaLoyaltyProgram: {
        veScaRewardPool: addresses.veScaLoyaltyProgram.veScaRewardPool,
        veScaRewardTableId: addresses.veScaLoyaltyProgram.veScaRewardTableId,
      },
    },
  };
};

export const buildSpoolMetadata = (utils: ScallopUtils): SpoolMetadata => ({
  whitelist: { spool: utils.constants.whitelist.spool },
  addresses: {
    spoolObjectId: utils.address.get('spool.object'),
    // dense map over the spool whitelist (market-coin names) → pool object ids
    spools: [...utils.constants.whitelist.spool].reduce(
      (acc, name) => {
        acc[name] = {
          id: utils.address.get(`spool.pools.${name}.id`),
          rewardPoolId: utils.address.get(`spool.pools.${name}.rewardPoolId`),
        };
        return acc;
      },
      {} as Record<string, { id: string; rewardPoolId: string }>
    ),
  },
  poolAddresses: utils.constants.poolAddresses,
  parseCoinName: (marketCoinName) => utils.parseCoinName(marketCoinName),
  parseSymbol: (coinName) => utils.parseSymbol(coinName),
  parseCoinType: (coinName) => utils.parseCoinType(coinName),
  parseMarketCoinType: (coinName) => utils.parseMarketCoinType(coinName),
  parseSCoinType: (sCoinName) => utils.parseSCoinType(sCoinName),
  isMarketCoin: (coinName) => utils.isMarketCoin(coinName),
  getCoinDecimal: (coinName) => utils.getCoinDecimal(coinName) ?? 0,
  getSpoolRewardCoinName: () => utils.getSpoolRewardCoinName(),
});

export const buildXOracleMetadata = (utils: ScallopUtils): XOracleMetadata => ({
  addresses: {
    // per-oracle package object ids (projection from core.packages.<oracle>.object)
    ...SUPPORTED_ORACLES.reduce(
      (acc, oracle) => {
        acc[oracle] = {
          object: utils.address.get(`core.packages.${oracle}.object`),
        };
        return acc;
      },
      {} as Record<(typeof SUPPORTED_ORACLES)[number], { object: string }>
    ),
    xOracleObject: utils.address.get('core.packages.xOracle.object'),
    oracles: {
      primaryPriceUpdatePolicyVecsetId: utils.address.get(
        'core.oracles.primaryPriceUpdatePolicyVecsetId'
      ),
      secondaryPriceUpdatePolicyVecsetId: utils.address.get(
        'core.oracles.secondaryPriceUpdatePolicyVecsetId'
      ),
      primaryPriceUpdatePolicyObject: utils.address.get(
        'core.oracles.primaryPriceUpdatePolicyObject'
      ),
      secondaryPriceUpdatePolicyObject: utils.address.get(
        'core.oracles.secondaryPriceUpdatePolicyObject'
      ),
      switchboardRegistryTableId: utils.address.get(
        'core.oracles.switchboard.registryTableId'
      ),
    },
  },
  whitelist: { lending: utils.constants.whitelist.lending },
  parseCoinNameFromType: (type) => utils.parseCoinNameFromType(type),
  parseCoinType: (coinName) => utils.parseCoinType(coinName),
  getSwitchboardAggAddress: (coinName) =>
    utils.address.get(`core.coins.${coinName}.oracle.switchboard`),
});
