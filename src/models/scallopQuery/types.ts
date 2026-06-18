import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import ScallopUtils from '../scallopUtils/index.js';
import { ScallopUtilsConstructorParams } from '../scallopUtils/types.js';

export type ScallopQueryConstructorParams = {
  utils?: ScallopUtils;
  queryClient?: QueryClient;
  queryClientConfig?: QueryClientConfig;
} & ScallopUtilsConstructorParams;
