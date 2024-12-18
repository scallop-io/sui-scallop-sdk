import { SUPPORT_POOLS } from 'src/constants';
import { ScallopQuery } from 'src/models';
import { OptionalKeys, SupportPoolCoins } from 'src/types';

export const getAllAddresses = async (query: ScallopQuery) => {
  const results: OptionalKeys<
    Record<
      SupportPoolCoins,
      {
        lendingPoolAddress?: string;
        collateralPoolAddress?: string; // not all pool has collateral
        borrowDynamic?: string;
        spoolReward?: string;
        spool?: string;
        sCoinTreasury?: string;
        interestModel?: string;
        riskModel?: string;
        borrowFeeKey?: string;
        supplyLimitKey?: string;
        borrowLimitKey?: string;
        isolatedAssetKey?: string;
      }
    >
  > = {};

  const marketId = query.address.get('core.market');
  const marketObject = (
    await query.cache.queryGetObject(marketId, {
      showContent: true,
    })
  )?.data;

  if (!(marketObject && marketObject.content?.dataType === 'moveObject'))
    throw new Error(`Failed to fetch marketObject`);

  const fields = marketObject.content.fields as any;

  const coinTypesPairs = SUPPORT_POOLS.reduce(
    (acc, pool) => {
      acc.push([pool, query.utils.parseCoinType(pool).substring(2)]);
      return acc;
    },
    [] as [SupportPoolCoins, string][]
  );
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
    try {
      return (
        await query.cache.queryGetDynamicFieldObject({
          parentId,
          name: {
            type,
            value,
          },
        })
      )?.data?.objectId;
    } catch (_e) {
      return undefined;
    }
  };

  await Promise.all(
    coinTypesPairs.map(async ([coinName, coinType]) => {
      const addresses = await Promise.all([
        fetchDynamicObject(balanceSheetParentId, ADDRESS_TYPE, {
          name: coinType,
        }),
        fetchDynamicObject(collateralStatsParentId, ADDRESS_TYPE, {
          name: coinType,
        }),
        fetchDynamicObject(borrowDynamicsParentid, ADDRESS_TYPE, {
          name: coinType,
        }),
        fetchDynamicObject(interestModelParentId, ADDRESS_TYPE, {
          name: coinType,
        }),
        fetchDynamicObject(riskModelParentId, ADDRESS_TYPE, {
          name: coinType,
        }),
        fetchDynamicObject(marketId, BORROW_FEE_TYPE, coinType),
        fetchDynamicObject(marketId, SUPPLY_LIMIT_TYPE, coinType),
        fetchDynamicObject(marketId, BORROW_LIMIT_TYPE, coinType),
        fetchDynamicObject(marketId, ISOLATED_ASSET_KEY, coinType),
      ]);

      const spool = query.address.get(
        // @ts-ignore
        `spool.pools.s${coinName}.id`
      );
      const rewardPool = query.address.get(
        // @ts-ignore
        `spool.pools.s${coinName}.rewardPoolId`
      );
      const sCoinTreasury = query.address.get(
        // @ts-ignore
        `scoin.coins.s${coinName}.treasury`
      );
      results[coinName as SupportPoolCoins] = {
        lendingPoolAddress: addresses[0],
        collateralPoolAddress: addresses[1],
        borrowDynamic: addresses[2],
        interestModel: addresses[3],
        riskModel: addresses[4],
        borrowFeeKey: addresses[5],
        supplyLimitKey: addresses[6],
        borrowLimitKey: addresses[7],
        isolatedAssetKey: addresses[8],
        spool,
        spoolReward: rewardPool,
        sCoinTreasury,
      };

      await new Promise((resolve) => setTimeout(resolve, 200));
    })
  );

  return results;
};
