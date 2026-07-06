import { queryKeys } from 'src/constants/queryKeys.js';
import { AddressApiFetchResponse, AddressApiRepoContext } from './types.js';

export const readFromApi = async (
  ctx: AddressApiRepoContext,
  addressId: string
) => {
  const { api, fetchWithCache } = ctx;

  return fetchWithCache({
    queryKey: queryKeys.api.getAddresses({ addressId }),
    queryFn: () => api.get<AddressApiFetchResponse>(`/addresses/${addressId}`),
  });
};
