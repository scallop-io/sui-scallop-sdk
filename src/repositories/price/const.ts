export const DEFAULT_PYTH_URL = 'https://pyth.dourolabs.app/hermes' as const;
export const LEGACY_PYTH_HERMES_ENDPOINT = 'https://hermes.pyth.network';

/**
 * Default cache lifetime (ms) for the full Pyth price-feed list. Within this
 * window, single/subset price reads are served from the one cached full-list
 * fetch instead of hitting the Pyth API again.
 */
export const DEFAULT_PRICE_TIMEOUT = 5_000;

/**
 * CoinGecko id per coin, for coins whose xOracle rule routes away from pyth and
 * whose price therefore comes from the indexer's CoinGecko passthrough
 * (`/api/price/coingecko?id=<id>`). SCA moved here with the custom oracle.
 *
 * A coin in `nonPythCoinNames` with no entry here has no API price source and
 * resolves to 0.
 */
export const COINGECKO_IDS: Record<string, string> = {
  sca: 'scallop-2',
};

/** Indexer path for the CoinGecko price passthrough. */
export const COINGECKO_PRICE_PATH = '/api/price/coingecko';
