import { bcs } from '@mysten/sui/bcs';

const TypeName = bcs.struct('TypeName', { name: bcs.string() });
const Table = bcs.struct('Table', { id: bcs.Address, size: bcs.u64() });

export const IncentiveAccountBcs = bcs.struct('IncentiveAccount', {
  id: bcs.Address,
  pool_records: Table,
  pool_types: bcs.struct('VecSet', { contents: bcs.vector(TypeName) }),
  binded_ve_sca_key: bcs.option(bcs.Address),
});
