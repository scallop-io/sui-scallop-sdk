import { bcs } from '@mysten/sui/bcs';

export const VeScaBcs = bcs.struct('VeSca', {
  locked_amount: bcs.u64(),
  unlock_at: bcs.u64(),
});
