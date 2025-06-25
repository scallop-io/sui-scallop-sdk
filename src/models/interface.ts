import type { default as ScallopAddress } from './scallopAddress';
import type { default as ScallopBuilder } from './scallopBuilder';
import type { default as ScallopConstants } from './scallopConstants';
import type { default as ScallopQuery } from './scallopQuery';
import type { default as ScallopSuiKit } from './scallopSuiKit';
import type { default as ScallopUtils } from './scallopUtils';

interface ScallopBaseInterface {
  scallopSuiKit: ScallopSuiKit;
  constants: ScallopConstants;
  walletAddress: string;
  init: () => Promise<void>;
}

interface ScallopUtilsInterface extends ScallopBaseInterface {
  address: ScallopAddress;
}

interface ScallopQueryInterface extends ScallopUtilsInterface {
  utils: ScallopUtils;
}

interface ScallopBuilderInterface extends ScallopQueryInterface {
  query: ScallopQuery;
}

interface ScallopClientInterface extends ScallopBaseInterface {
  builder: ScallopBuilder;
}

export type {
  ScallopUtilsInterface,
  ScallopQueryInterface,
  ScallopBuilderInterface,
  ScallopClientInterface,
};
