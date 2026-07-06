import { getFullnodeUrl } from '@scallop-io/sui-kit';

// v2: Use official Sui RPC only (gRPC supported)
// Third-party RPCs may not support gRPC protocol
export const RPC_PROVIDERS = [getFullnodeUrl('mainnet')];
