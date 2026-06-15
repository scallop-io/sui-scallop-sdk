import { QueryClient } from '@tanstack/query-core';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache.js';

export const QUERY_CLIENT = new QueryClient(DEFAULT_CACHE_OPTIONS);
