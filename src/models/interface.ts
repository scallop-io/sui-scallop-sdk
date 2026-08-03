import ScallopAddress from './scallopAddress/index.js';
import ScallopBuilder from './scallopBuilder/index.js';
import ScallopQuery from './scallopQuery/index.js';
import type { ReadTransport } from './scallopQuery/types.js';
import ScallopUtils from './scallopUtils/index.js';
import { TransactionExecutor } from './transactionExecutor.js';

export interface ScallopBaseInterface {
  walletAddress: string;
  init: () => Promise<void>;
}

interface ScallopUtilsInterface extends ScallopBaseInterface {
  address: ScallopAddress;
}

interface ScallopQueryInterface extends ScallopUtilsInterface {
  utils: ScallopUtils;
}

// `ReadTransport` (the full union) rather than the classes' `'grpc'` default:
// these interfaces describe both transports, so they must accept either.
interface ScallopBuilderInterface extends ScallopQueryInterface {
  query: ScallopQuery<ReadTransport>;
  executor: TransactionExecutor;
}

interface ScallopClientInterface extends ScallopBuilderInterface {
  builder: ScallopBuilder<ReadTransport>;
}

export type {
  ScallopBuilderInterface,
  ScallopClientInterface,
  ScallopQueryInterface,
  ScallopUtilsInterface,
};
