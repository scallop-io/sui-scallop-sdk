/**
 * Thrown when someone asks for an oracle type we haven’t onboarded yet.
 */
class UnsupportedOracleError extends Error {
  constructor(oracle: string) {
    super(`Unsupported oracle type: ${oracle}`);
    this.name = 'UnsupportedOracleError';
  }
}

class UnsupportedLstUpdateError extends Error {
  constructor(lst: string) {
    super(`Unsupported LST update for: ${lst}`);
    this.name = 'UnsupportedLstUpdateError';
  }
}

class UnsupportedLstOracleError extends Error {
  constructor(lst: string, oracle: string) {
    super(`Unsupported LST oracle update for: ${lst} with oracle: ${oracle}`);
    this.name = 'UnsupportedLstOracleError';
  }
}

export {
  UnsupportedOracleError,
  UnsupportedLstUpdateError,
  UnsupportedLstOracleError,
};
