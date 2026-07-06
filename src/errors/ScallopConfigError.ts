import { ScallopError, type ScallopErrorOptions } from './ScallopError.js';

export class ScallopConfigError extends ScallopError {
  constructor(message: string, options?: ScallopErrorOptions) {
    super('SCALLOP_CONFIG_ERROR', message, options);
    this.name = 'ScallopConfigError';
  }
}
