import type { MarketQueryInterface } from 'src/types/index.js';
import { mapTypeNameField } from './moveTypeMapper.js';

export type MappedMarketQueryData = {
  pools: Array<
    Omit<MarketQueryInterface['pools'][number], 'type'> & {
      type: string;
    }
  >;
  collaterals: Array<
    Omit<MarketQueryInterface['collaterals'][number], 'type'> & {
      type: string;
    }
  >;
};

export const mapMarketEventToMarketData = (
  raw: MarketQueryInterface | undefined
): MappedMarketQueryData | undefined => {
  if (!raw) return undefined;

  return {
    ...raw,
    pools: (raw.pools ?? []).map((pool, index) => ({
      ...pool,
      type: mapTypeNameField(pool.type, `market.pools[${index}].type`),
    })),
    collaterals: (raw.collaterals ?? []).map((collateral, index) => ({
      ...collateral,
      type: mapTypeNameField(
        collateral.type,
        `market.collaterals[${index}].type`
      ),
    })),
  };
};
