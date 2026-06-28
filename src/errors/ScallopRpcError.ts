import { ScallopError, type ScallopErrorOptions } from './ScallopError.js';

export class ScallopRpcError extends ScallopError {
  constructor(message: string, options?: ScallopErrorOptions) {
    super('SCALLOP_RPC_ERROR', message, options);
    this.name = 'ScallopRpcError';
  }
}
