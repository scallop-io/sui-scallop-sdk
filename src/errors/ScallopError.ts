export type ScallopErrorCode =
  | 'SCALLOP_RPC_ERROR'
  | 'SCALLOP_INDEXER_ERROR'
  | 'SCALLOP_PARSE_ERROR'
  | 'SCALLOP_CONFIG_ERROR'
  | 'SCALLOP_TX_BUILD_ERROR';

export interface ScallopErrorOptions {
  cause?: unknown;
  context?: Record<string, unknown>;
}

export class ScallopError extends Error {
  readonly code: ScallopErrorCode;
  readonly context?: Record<string, unknown>;

  constructor(
    code: ScallopErrorCode,
    message: string,
    options?: ScallopErrorOptions
  ) {
    super(message);
    this.name = 'ScallopError';
    this.code = code;
    this.context = options?.context;
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}
