import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { AddressesInterface, OptionalKeys, PoolAddress } from 'src/types';

const RPC_PROVIDERS = [
  getFullnodeUrl('mainnet'),
  'https://sui-mainnet.public.blastapi.io',
  'https://sui-mainnet-ca-2.cosmostation.io',
  'https://sui-mainnet-eu-4.cosmostation.io',
  'https://sui-mainnet-endpoint.blockvision.org',
  'https://sui-rpc.publicnode.com',
  'https://sui-mainnet-rpc.allthatnode.com',
  'https://mainnet.suiet.app',
  'https://mainnet.sui.rpcpool.com',
  'https://sui1mainnet-rpc.chainode.tech',
  'https://fullnode.mainnet.apis.scallop.io',
  'https://sui-mainnet-us-2.cosmostation.io',
];

const tryRequest = async <T>(fn: (client: SuiClient) => T) => {
  for (const rpc of RPC_PROVIDERS) {
    try {
      const res = await fn(new SuiClient({ url: rpc }));
      return res;
    } catch (e: any) {
      if (e.status !== 429) {
        throw e;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('Failed to fetch data');
};

const queryFlashloanFeeObjectIds = async (
  client: SuiClient,
  coinTypeMap: Set<string>, // set of coin types
  flashloanFeeTableId: string = '0x00481a93b819d744a7d79ecdc6c62c74f2f7cb4779316c4df640415817ac61bb'
) => {
  let cursor: string | null | undefined = null;
  let nextPage: boolean = false;
  const flashloanFeeObjectIds: Record<string, string> = {}; // <coinType, flashloanFeeObjectId>

  do {
    const resp = await client.getDynamicFields({
      parentId: flashloanFeeTableId,
      limit: 10,
      cursor,
    });
    if (!resp) break;
    const { data, hasNextPage, nextCursor } = resp;
    // get the dynamic object ids
    data.forEach((field) => {
      const assetType = `0x${(field.name.value as any).name as string}`;
      if (coinTypeMap.has(assetType)) {
        flashloanFeeObjectIds[assetType] = field.objectId;
      }
    });
    nextPage = hasNextPage;
    cursor = nextCursor;
  } while (nextPage);

  return flashloanFeeObjectIds;
};

export const getPoolAddresses = async (
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
    await tryRequest(async (client) => {
      return await client.getObject({
        id: marketId,
        options: {
          showContent: true,
        },
      });
    })
  ).data;

  if (!(marketObject && marketObject.content?.dataType === 'moveObject'))
    throw new Error(`Failed to fetch marketObject`);

  const fields = marketObject.content.fields as any;

  const balanceSheetParentId =
    fields.vault.fields.balance_sheets.fields.table.fields.id.id;

  const collateralStatsParentId =
    fields.collateral_stats.fields.table.fields.id.id;

  const borrowDynamicsParentid =
    fields.borrow_dynamics.fields.table.fields.id.id;

  const interestModelParentId =
    fields.interest_models.fields.table.fields.id.id;

  const riskModelParentId = fields.risk_models.fields.table.fields.id.id;

  const ADDRESS_TYPE = `0x1::type_name::TypeName`;
  const BORROW_FEE_TYPE = `0xc38f849e81cfe46d4e4320f508ea7dda42934a329d5a6571bb4c3cb6ea63f5da::market_dynamic_keys::BorrowFeeKey`;
  const SUPPLY_LIMIT_TYPE = `0x6e641f0dca8aedab3101d047e96439178f16301bf0b57fe8745086ff1195eb3e::market_dynamic_keys::SupplyLimitKey`;
  const BORROW_LIMIT_TYPE = `0xe7dbb371a9595631f7964b7ece42255ad0e738cc85fe6da26c7221b220f01af6::market_dynamic_keys::BorrowLimitKey`; // prod
  const ISOLATED_ASSET_KEY = `0xe7dbb371a9595631f7964b7ece42255ad0e738cc85fe6da26c7221b220f01af6::market_dynamic_keys::IsolatedAssetKey`;
  const fetchDynamicObject = async (
    parentId: string,
    type: string,
    value: any
  ) => {
    return (
      await tryRequest(async (client) => {
        return await client.getDynamicFieldObject({
          parentId,
          name: {
            type,
            value,
          },
        });
      })
    ).data?.objectId;
  };

  // query flashloan fee objects first
  const flashloanFeeObjectIds = await tryRequest(async (client) => {
    return await queryFlashloanFeeObjectIds(
      client,
      new Set(coinTypesPairs.map(([, coinType]) => coinType))
    );
  });

  await Promise.all(
    coinTypesPairs.map(async ([coinName, coinType]) => {
      const coinTypeKey = coinType.slice(2);
      const addresses = await Promise.all([
        fetchDynamicObject(balanceSheetParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        fetchDynamicObject(collateralStatsParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        fetchDynamicObject(borrowDynamicsParentid, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        fetchDynamicObject(interestModelParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        fetchDynamicObject(riskModelParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        fetchDynamicObject(marketId, BORROW_FEE_TYPE, coinTypeKey),
        fetchDynamicObject(marketId, SUPPLY_LIMIT_TYPE, coinTypeKey),
        fetchDynamicObject(marketId, BORROW_LIMIT_TYPE, coinTypeKey),
        fetchDynamicObject(marketId, ISOLATED_ASSET_KEY, coinTypeKey),
      ]);

      // @ts-ignore
      const { symbol, metaData: coinMetadataId } =
        addressApiResponse.core.coins[coinName];

      let spoolData = {
        spool: '',
        spoolReward: '',
      };
      const _spoolData = addressApiResponse.spool.pools[`s${coinName}`];
      // @ts-ignore
      if (_spoolData) {
        // @ts-ignore
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
          await tryRequest(async (client) => {
            return await client.getCoinMetadata({
              coinType: coinType,
            });
          })
        )?.decimals ?? 0;
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
        isolatedAssetKey: addresses[8] ?? '',
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
