import { GrpcDataSource } from 'src/datasources/grpc.js';
import { ClientWithCoreMethods } from 'src/datasources/types.js';
import { Logger } from 'src/logger/Logger.js';
import { ScallopBaseInterface } from '../interface.js';
import ScallopAddress from '../scallopAddress/index.js';
import ScallopConstants from '../scallopConstants/index.js';
import { ScallopConstantsConstructorParams } from '../scallopConstants/types.js';

type ScallopUtilsBaseParams = {
  walletAddress: string;
  scallopConstants?: ScallopConstants;
  logger?: Logger;
  coreClient: ClientWithCoreMethods;
} & ScallopConstantsConstructorParams;

// Kept as a TOP-LEVEL distributive union (not `base & (Grpc | Graphql)`) so the
// mutually-exclusive `readTransport` transport guard survives the `Omit` /
// intersections in the builder → client → Scallop param chain. See
// `DistributiveMerge`.
export type ScallopUtilsConstructorParams = ScallopUtilsBaseParams;

export interface ScallopUtilsInterface extends ScallopBaseInterface {
  address: ScallopAddress;
  grpc: GrpcDataSource;
}

export type CoinWrappedType =
  | {
      from: string;
      type: string;
    }
  | undefined;
