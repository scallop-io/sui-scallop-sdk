import type {
  AddressesInterface,
  OptionalKeys,
  PoolAddress,
  SuiParsedData,
  SuiObjectData,
} from 'src/types/index.js';
import type { ClientWithCoreApi } from '@mysten/sui/client';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { parseObjectAs } from 'src/utils/index.js';
import { bcs } from '@mysten/sui/bcs';

const queryFlashloanFeeObjectIds = async (
  client: ClientWithCoreApi,
  coinTypeMap: Set<string>, // set of coin types
  flashloanFeeTableId: string = '0x00481a93b819d744a7d79ecdc6c62c74f2f7cb4779316c4df640415817ac61bb'
) => {
  let cursor: string | null | undefined = null;
  let hasNextPage: boolean = false;
  const flashloanFeeObjectIds: Record<string, string> = {}; // <coinType, flashloanFeeObjectId>

  do {
    const resp = await client.core.listDynamicFields({
      parentId: flashloanFeeTableId,
      limit: 10,
      cursor,
    });
    if (!resp) break;

    const fields = resp.dynamicFields;
    fields.forEach((field: any) => {
      const rawBcs = field.name.bcs;
      const parsed = bcs
        .struct('TypeName', { name: bcs.string() })
        .parse(rawBcs);
      const assetType = `0x${(parsed as any).name as string}`;
      if (coinTypeMap.has(assetType)) {
        flashloanFeeObjectIds[assetType] = field.fieldId;
      }
    });

    hasNextPage = resp.hasNextPage;
    cursor = resp.cursor;
  } while (hasNextPage);

  return flashloanFeeObjectIds;
};

type FetchDynamicObjectReturnType<T extends boolean> = T extends true
  ? string | undefined
  : (SuiParsedData & { dataType: 'moveObject' }) | null | undefined;

const fetchDynamicObject = async <S extends boolean>(
  client: ClientWithCoreApi,
  parentId: string,
  type: string,
  value: any,
  returnObjId: S = true as S
): Promise<FetchDynamicObjectReturnType<S>> => {
  const nameParam = encodeDynamicFieldNameForV2({ type, value });

  // Use getDynamicField + getObject instead of getDynamicObjectField,
  // because getDynamicObjectField wraps with Wrapper<Type> which only works
  // for DynamicObjectFields. Some keys (BorrowFeeKey, SupplyLimitKey, etc.)
  // are regular DynamicFields.
  try {
    const { dynamicField } = await client.core.getDynamicField({
      parentId,
      name: nameParam,
    });

    const { object } = await client.core.getObject({
      objectId: dynamicField.fieldId,
      include: { content: true, json: true },
    });

    if (!object) return undefined as FetchDynamicObjectReturnType<S>;

    if (returnObjId) return object.objectId as FetchDynamicObjectReturnType<S>;
    else return object.json as FetchDynamicObjectReturnType<S>;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.toLowerCase().includes('not found')) {
      return undefined as FetchDynamicObjectReturnType<S>;
    }
    throw e;
  }
};

export const getPoolAddresses = async (
  client: ClientWithCoreApi,
  addressId: string,
  poolNames: string[] = []
) => {
  const poolNameSet = new Set(poolNames);
  const results: OptionalKeys<Record<string, PoolAddress>> = {};

  // fetch the Address API
  const URL = 'https://sui.apis.scallop.io';
  const addressApiResponse = (
    await fetch(`${URL}/addresses/${addressId}`).then((res) => res.json())
  ).mainnet as unknown as AddressesInterface;

  if (!addressApiResponse) throw new Error('Failed to fetch addresses');

  // Compose pools based on addresses
  const pools = Object.keys(addressApiResponse.core.coins);
  if (pools.length === 0) throw new Error('Pools empty');

  const coinTypesPairs = pools.reduce(
    (acc, poolName) => {
      if (poolNameSet.size > 0 && !poolNameSet.has(poolName)) return acc;
      const value =
        addressApiResponse.core.coins[
          poolName as keyof typeof addressApiResponse.core.coins
        ];
      if (value && value.coinType) {
        acc.push([poolName, value.coinType]);
      }
      return acc;
    },
    [] as [string, string][]
  );
  if (coinTypesPairs.length === 0) throw new Error('No coinTypesPairs');

  const marketId = addressApiResponse.core.market;
  const marketObject = (
    await client.core.getObject({
      objectId: marketId,
      include: { content: true, json: true },
    })
  )?.object;

  if (!(marketObject && marketObject.json))
    throw new Error(`Failed to fetch marketObject`);

  const fields = parseObjectAs<{
    vault: { balance_sheets: { table: { id: { id: string } } } };
    collateral_stats: { table: { id: { id: string } } };
    borrow_dynamics: { table: { id: { id: string } } };
    interest_models: { table: { id: { id: string } } };
    risk_models: { table: { id: { id: string } } };
  }>(marketObject as SuiObjectData);

  const balanceSheetParentId = fields.vault.balance_sheets.table.id.id;

  const collateralStatsParentId = fields.collateral_stats.table.id.id;

  const borrowDynamicsParentid = fields.borrow_dynamics.table.id.id;

  const interestModelParentId = fields.interest_models.table.id.id;

  const riskModelParentId = fields.risk_models.table.id.id;

  const ADDRESS_TYPE = `0x1::type_name::TypeName`;
  const BORROW_FEE_TYPE = `0xc38f849e81cfe46d4e4320f508ea7dda42934a329d5a6571bb4c3cb6ea63f5da::market_dynamic_keys::BorrowFeeKey`;
  const SUPPLY_LIMIT_TYPE = `0x6e641f0dca8aedab3101d047e96439178f16301bf0b57fe8745086ff1195eb3e::market_dynamic_keys::SupplyLimitKey`;
  const BORROW_LIMIT_TYPE = `0xe7dbb371a9595631f7964b7ece42255ad0e738cc85fe6da26c7221b220f01af6::market_dynamic_keys::BorrowLimitKey`; // prod
  const ISOLATED_ASSET_KEY = `0xe7dbb371a9595631f7964b7ece42255ad0e738cc85fe6da26c7221b220f01af6::market_dynamic_keys::IsolatedAssetKey`;

  // query flashloan fee objects first
  const flashloanFeeObjectIds = await queryFlashloanFeeObjectIds(
    client,
    new Set(coinTypesPairs.map(([, coinType]) => coinType))
  );

  await Promise.all(
    coinTypesPairs.map(async ([coinName, coinType]) => {
      const coinTypeKey = coinType.slice(2);
      const addresses = await Promise.all([
        fetchDynamicObject(
          client,
          balanceSheetParentId,
          ADDRESS_TYPE,
          {
            name: coinTypeKey,
          },
          true
        ),
        fetchDynamicObject(
          client,
          collateralStatsParentId,
          ADDRESS_TYPE,
          {
            name: coinTypeKey,
          },
          true
        ),
        fetchDynamicObject(
          client,
          borrowDynamicsParentid,
          ADDRESS_TYPE,
          {
            name: coinTypeKey,
          },
          true
        ),
        fetchDynamicObject(
          client,
          interestModelParentId,
          ADDRESS_TYPE,
          {
            name: coinTypeKey,
          },
          true
        ),
        fetchDynamicObject(
          client,
          riskModelParentId,
          ADDRESS_TYPE,
          {
            name: coinTypeKey,
          },
          true
        ),
        fetchDynamicObject(
          client,
          marketId,
          BORROW_FEE_TYPE,
          coinTypeKey,
          true
        ),
        fetchDynamicObject(
          client,
          marketId,
          SUPPLY_LIMIT_TYPE,
          coinTypeKey,
          true
        ),
        fetchDynamicObject(
          client,
          marketId,
          BORROW_LIMIT_TYPE,
          coinTypeKey,
          true
        ),
        fetchDynamicObject(
          client,
          marketId,
          ISOLATED_ASSET_KEY,
          coinTypeKey,
          false
        ),
      ]);

      // @ts-ignore
      const { symbol, metaData: coinMetadataId } =
        addressApiResponse.core.coins[coinName];

      let spoolData = {
        spool: '',
        spoolReward: '',
      };
      const _spoolData = addressApiResponse.spool.pools[`s${coinName}`];
      if (_spoolData) {
        const { id: spool, rewardPoolId: spoolReward } = _spoolData;
        spoolData = {
          spool,
          spoolReward,
        };
      }

      let sCoinData = {
        sCoinType: '',
        sCoinTreasury: '',
        sCoinMetadataId: '',
        sCoinSymbol: '',
      };
      const sCoinName = `s${coinName}`;
      const _sCoinData = addressApiResponse.scoin.coins[sCoinName];
      if (_sCoinData) {
        const {
          coinType: sCoinType,
          treasury: sCoinTreasury,
          metaData: sCoinMetadataId,
          symbol: sCoinSymbol,
        } = _sCoinData;
        sCoinData = {
          sCoinType,
          sCoinTreasury,
          sCoinMetadataId,
          sCoinSymbol,
        };
      }

      let pythData = {
        pythFeed: '',
        pythFeedObjectId: '',
      };

      if (addressApiResponse.core.coins[coinName]?.oracle.pyth) {
        const { feed: pythFeed, feedObject: pythFeedObjectId } =
          //@ts-ignore
          addressApiResponse.core.coins[coinName].oracle.pyth;
        pythData = {
          pythFeed,
          pythFeedObjectId,
        };
      }
      const { feed: _pythFeed, feedObject: _pythFeedObjectId } =
        //@ts-ignore
        addressApiResponse.core.coins[coinName].oracle.pyth;

      const decimals =
        (
          await client.core.getCoinMetadata({
            coinType,
          })
        )?.coinMetadata?.decimals ?? 0;
      const spoolName = spoolData ? `s${coinName}` : undefined;

      results[coinName] = {
        coinName,
        symbol,
        lendingPoolAddress: addresses[0] ?? '',
        collateralPoolAddress: addresses[1] ?? '',
        borrowDynamic: addresses[2] ?? '',
        interestModel: addresses[3] ?? '',
        riskModel: addresses[4],
        borrowFeeKey: addresses[5] ?? '',
        supplyLimitKey: addresses[6] ?? '',
        borrowLimitKey: addresses[7] ?? '',
        isolatedAssetKey: (addresses[8] as any)?.id ?? '',
        isIsolated: (addresses[8] as any)?.value ?? false,
        ...spoolData,
        ...sCoinData,
        sCoinName,
        coinMetadataId,
        coinType,
        spoolName,
        decimals,
        ...pythData,
        flashloanFeeObject: flashloanFeeObjectIds[coinType] ?? '',
      };

      await new Promise((resolve) => setTimeout(resolve, 1000));
    })
  );

  return results;
};
