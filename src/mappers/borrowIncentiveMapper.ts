import type {
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentivePoolsQueryInterface,
} from 'src/types/index.js';
import type {
  OriginBorrowIncentiveAccountData,
  OriginBorrowIncentiveAccountPoolData,
  OriginBorrowIncentivePoolData,
  OriginBorrowIncentivePoolPointData,
} from 'src/types/internal/index.js';
import { mapTypeNameField } from './moveTypeMapper.js';

export type MappedBorrowIncentivePoolPointData = Omit<
  OriginBorrowIncentivePoolPointData,
  'point_type'
> & { point_type: string };

export type MappedBorrowIncentivePoolData = Omit<
  OriginBorrowIncentivePoolData,
  'pool_type' | 'points'
> & {
  pool_type: string;
  points: MappedBorrowIncentivePoolPointData[];
};

export type MappedBorrowIncentivePoolsQueryData = {
  incentive_pools: MappedBorrowIncentivePoolData[];
};

export type MappedBorrowIncentiveAccountPoolData = Omit<
  OriginBorrowIncentiveAccountPoolData,
  'point_type'
> & { point_type: string };

export type MappedBorrowIncentiveAccountData = Omit<
  OriginBorrowIncentiveAccountData,
  'pool_type' | 'points_list'
> & {
  pool_type: string;
  points_list: MappedBorrowIncentiveAccountPoolData[];
};

export type MappedBorrowIncentiveAccountsQueryData = {
  pool_records: MappedBorrowIncentiveAccountData[];
};

export const mapBorrowIncentivePoolsEvent = (
  raw: BorrowIncentivePoolsQueryInterface | undefined
): MappedBorrowIncentivePoolsQueryData | undefined => {
  if (!raw) return undefined;

  return {
    ...raw,
    incentive_pools: (raw.incentive_pools ?? []).map((pool, poolIndex) => ({
      ...pool,
      pool_type: mapTypeNameField(
        pool.pool_type,
        `borrowIncentive.incentive_pools[${poolIndex}].pool_type`
      ),
      points: (pool.points ?? []).map((point, pointIndex) => ({
        ...point,
        point_type: mapTypeNameField(
          point.point_type,
          `borrowIncentive.incentive_pools[${poolIndex}].points[${pointIndex}].point_type`
        ),
      })),
    })),
  };
};

export const mapBorrowIncentiveAccountsEvent = (
  raw: BorrowIncentiveAccountsQueryInterface | undefined
): MappedBorrowIncentiveAccountsQueryData | undefined => {
  if (!raw) return undefined;

  return {
    ...raw,
    pool_records: (raw.pool_records ?? []).map((record, recordIndex) => ({
      ...record,
      pool_type: mapTypeNameField(
        record.pool_type,
        `borrowIncentive.pool_records[${recordIndex}].pool_type`
      ),
      points_list: (record.points_list ?? []).map((point, pointIndex) => ({
        ...point,
        point_type: mapTypeNameField(
          point.point_type,
          `borrowIncentive.pool_records[${recordIndex}].points_list[${pointIndex}].point_type`
        ),
      })),
    })),
  };
};
