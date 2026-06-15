import { SuiClientTypes } from '@mysten/sui/client';
import { IsolatedAssetsRepoContext } from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { ISOLATED_ASSET_KEY_TYPE } from './const.js';
import { IsolatedAssetBcs, IsolatedAssetTypeBcs } from './bcs.js';
import { PoolAddress } from 'src/types/index.js';

const queryIsolatedAssets = async (ctx: IsolatedAssetsRepoContext) => {
  const {
    onchain,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;

  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;

  const isIsolatedDynamicField = (
    dynamicField: SuiClientTypes.DynamicFieldEntry
  ) => {
    return dynamicField.name.type === ISOLATED_ASSET_KEY_TYPE;
  };

  const isolatedAssetCoinTypes: string[] = [];

  do {
    const options: SuiClientTypes.ListDynamicFieldsOptions = {
      parentId: addresses.market,
      cursor: nextCursor,
      limit: 50,
      // @ts-ignore For grpc implementation (which most likely will be used), `include` is supported
      include: {
        value: true,
      },
    };
    const {
      dynamicFields,
      hasNextPage: nextPage,
      cursor,
    } = await fetchWithCache({
      queryKey: queryKeys.rpc.getDynamicFields({
        ...options,
        node: onchain.url,
      }),
      queryFn: () => onchain.client.listDynamicFields(options),
    });

    const coinTypes = dynamicFields
      .filter((df) => {
        if (!isIsolatedDynamicField(df)) {
          return false;
        }

        // Check value
        // @ts-ignore
        return IsolatedAssetBcs.parse(df.valueType.bcs);
      })
      .map((df) => `0x${IsolatedAssetTypeBcs.parse(df.name.bcs)}`);

    isolatedAssetCoinTypes.push(...coinTypes);
    nextCursor = cursor;
    hasNextPage = nextPage;
  } while (hasNextPage);

  return isolatedAssetCoinTypes;
};

export const getIsolatedAssetsFromOnChain = async (
  ctx: IsolatedAssetsRepoContext
) => {
  return queryIsolatedAssets(ctx);
};

export const getIsolatedAssetsFromApi = async (
  ctx: IsolatedAssetsRepoContext
) => {
  const {
    metadata: { poolAddresses, whitelist },
  } = ctx;
  return Object.values(poolAddresses)
    .filter(
      (poolAddress): poolAddress is PoolAddress =>
        poolAddress !== undefined &&
        whitelist.lending.has(poolAddress.coinName) &&
        poolAddress.isIsolated
    )
    .map((t) => t.coinType);
};
