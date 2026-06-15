import type { SuiKit } from '@scallop-io/sui-kit';
import ScallopAddress from './scallopAddress.js';
import ScallopBuilder from './scallopBuilder.js';
import ScallopConstants from './scallopConstants.js';
import ScallopQuery from './scallopQuery.js';
import type { TransactionExecutor } from './transactionExecutor.js';
import ScallopUtils from './scallopUtils.js';

interface ScallopBaseInterface {
  suiKit: SuiKit;
  executor: TransactionExecutor;
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

interface ScallopClientInterface extends ScallopBuilderInterface {
  builder: ScallopBuilder;
}

export type {
  ScallopUtilsInterface,
  ScallopQueryInterface,
  ScallopBuilderInterface,
  ScallopClientInterface,
};
