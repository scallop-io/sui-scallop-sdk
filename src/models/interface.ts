import ScallopAddress from './scallopAddress';
import ScallopBuilder from './scallopBuilder';
import ScallopConstants from './scallopConstants';
import ScallopQuery from './scallopQuery';
import ScallopSuiKit from './scallopSuiKit';
import ScallopUtils from './scallopUtils';

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
