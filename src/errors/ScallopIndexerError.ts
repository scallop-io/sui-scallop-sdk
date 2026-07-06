import { ScallopError, type ScallopErrorOptions } from './ScallopError.js';

export class ScallopIndexerError extends ScallopError {
  constructor(message: string, options?: ScallopErrorOptions) {
    super('SCALLOP_INDEXER_ERROR', message, options);
    this.name = 'ScallopIndexerError';
  }
}
