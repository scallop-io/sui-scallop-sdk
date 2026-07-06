import { bcs } from '@mysten/sui/bcs';

// The reward-table value is a Move `u64` (Sui renders it as a JSON number-string,
// which the legacy JSON-RPC path parsed). Decoding the raw BCS bytes therefore
// needs `u64`, not `string` — `bcs.string()` misreads the 8 LE bytes as a length-
// prefixed string and yields NaN downstream.
export const UserRewardBcs = bcs.u64();
