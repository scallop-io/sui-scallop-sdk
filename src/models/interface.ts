import type { OnChainDataSource } from 'src/datasources/onchain.js';
import ScallopAddress from './scallopAddress/index.js';
import ScallopBuilder from './scallopBuilder/index.js';
import ScallopQuery from './scallopQuery/index.js';
import ScallopUtils from './scallopUtils/index.js';
import { TransactionExecutor } from './transactionExecutor.js';

export interface ScallopBaseInterface {
  // client: ClientWithCoreApi;
  // fullnodeUrl: string;
  walletAddress: string;
  // constants: ScallopConstants;
  init: () => Promise<void>;
}

interface ScallopUtilsInterface extends ScallopBaseInterface {
  address: ScallopAddress;
  onchain: OnChainDataSource;
}

interface ScallopQueryInterface extends ScallopUtilsInterface {
  utils: ScallopUtils;
}

interface ScallopBuilderInterface extends ScallopQueryInterface {
  query: ScallopQuery;
  executor: TransactionExecutor;
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
