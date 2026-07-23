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
 * Enumerate an object's dynamic fields WITH their values inline, in one paged
 * query. gRPC's `listDynamicFields` returns only field metadata (forcing a
 * second `getObjects` per value); GraphQL returns name + value together, so a
 * table walk collapses from "list ids + batch-fetch values" into a single paged
 * read. Mirrors the SDK's own `GetDynamicFieldsDocument` (see
 * `@mysten/sui/dist/graphql/generated/queries`) with `includeValue: true`,
 * requesting both `bcs` (for BCS parsers) and `json` (for shape-based parsers).
 */
const DYNAMIC_FIELDS_WITH_VALUES_QUERY = /* GraphQL */ `
  query DynamicFieldsWithValues(
    $parentId: SuiAddress!
    $first: Int
    $cursor: String
  ) {
    address(address: $parentId) {
      dynamicFields(first: $first, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
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
        }
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

export {
  COIN_BALANCES_BY_TYPES_QUERY,
  DYNAMIC_FIELDS_WITH_VALUES_QUERY,
  DYNAMIC_FIELD_NODE_SELECTION,
};
