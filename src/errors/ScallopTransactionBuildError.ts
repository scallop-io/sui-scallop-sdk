import { ScallopError, type ScallopErrorOptions } from './ScallopError.js';

export class ScallopTransactionBuildError extends ScallopError {
  constructor(message: string, options?: ScallopErrorOptions) {
    super('SCALLOP_TX_BUILD_ERROR', message, options);
    this.name = 'ScallopTransactionBuildError';
  }
}
