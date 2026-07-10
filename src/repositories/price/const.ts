export const DEFAULT_PYTH_URL = 'https://hermes.pyth.network' as const;

/**
 * Default cache lifetime (ms) for the full Pyth price-feed list. Within this
 * window, single/subset price reads are served from the one cached full-list
 * fetch instead of hitting the Pyth API again.
 */
export const DEFAULT_PRICE_TIMEOUT = 5_000;
