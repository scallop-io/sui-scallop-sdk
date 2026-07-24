/**
 * Fetch balances for a specific set of coin types in one round trip
 * (`multiGetBalances`), instead of paging every balance via `listBalances`.
 * gRPC has no multi-coin balance call, so this is a GraphQL-only read.
 */
const COIN_BALANCES_BY_TYPES_QUERY = /* GraphQL */ `
  query CoinBalancesByTypes($address: SuiAddress!, $coinTypes: [String!]!) {
    address(address: $address) {
      multiGetBalances(keys: $coinTypes) {
        coinType {
          repr
        }
        totalBalance
        coinBalance
        addressBalance
      }
    }
  }
`;

/**
 * The name+value sub-selection shared by the single-field alias reads. Requests
 * both `bcs` (for BCS parsers) and `json` (for shape-based parsers).
 */
const DYNAMIC_FIELD_NODE_SELECTION = /* GraphQL */ `
  name {
    bcs
    type {
      repr
    }
  }
  value {
    __typename
    ... on MoveValue {
      bcs
      json
      type {
        repr
      }
    }
    ... on MoveObject {
      address
      contents {
        bcs
        json
        type {
          repr
        }
      }
    }
  }
`;

export { COIN_BALANCES_BY_TYPES_QUERY, DYNAMIC_FIELD_NODE_SELECTION };
