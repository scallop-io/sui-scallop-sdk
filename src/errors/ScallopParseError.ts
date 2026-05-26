import { ScallopError, type ScallopErrorOptions } from './ScallopError.js';

export class ScallopParseError extends ScallopError {
  constructor(message: string, options?: ScallopErrorOptions) {
    super('SCALLOP_PARSE_ERROR', message, options);
    this.name = 'ScallopParseError';
  }
}
