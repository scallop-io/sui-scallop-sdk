# Use Scallop Constants

## Initialize class

```typescript
const scallopConstants = new ScallopConstants(
  addressId: '67c44a103fe1b8c454eb9699'
);

await scallopConstants.init();
```

- Overriding Pool Addresses value

```typescript
const CUSTOM_POOL_ADDRESSES = (...); // Record<string, PoolAddress>
const scallopConstants = new ScallopConstants(
  addressId: '67c44a103fe1b8c454eb9699',
  forcePoolAddressInterface: CUSTOM_POOL_ADDRESSES,
);

await scallopConstants.init();
```

- Overriding Whitelist value

```typescript
const CUSTOM_WHITELIST = (...); // Whitelist
const scallopConstants = new ScallopConstants(
  addressId: '67c44a103fe1b8c454eb9699',
  forceWhitelistInterface: CUSTOM_WHITELIST,
);

await scallopConstants.init();
```

- Setting default values

```typescript
const scallopConstants = new ScallopConstants(
  addressId: '67c44a103fe1b8c454eb9699',
  defaultValues: {
    poolAddresses: [DEFAULT_POOL_ADDRESSES],
    whitelist: [DEFEAULT_WHITELIST],
    addresses: [DEFAULT_ADDRESSES]
  }
)

await scallopConstants.init();
```

- Get Whitelist

```typescript
const lendingPoolWhitelist = scallopConstants.whitelist.lending;
const borrowingPoolWhitelist = scallopConstants.whitelist.borrowing;
const collateralWhitelist = scallopConstants.whitelist.collateral;
const packagesWhitelist = scallopConstants.whitelist.packages;
...
```

- Get Pool Addresses

```typescript
const poolAddresses = scallopConstants.poolAddresses; // Record<poolName, PoolAddress>
```

- Get coin decimals by coin name

```typescript
const coinName = 'sui';
const suiDecimal = scallopConstants.coinDecimals[coinName];
```

- Get coin type by coin name

```typescript
const coinName = 'wusdc';
const suiCoinType = scallopConstants.coinTypes[coinName];
...
const sCoinName = 'swusdt';
const swusdtScointype = scallopConstants.coinTypes[sCoinName];
```

- Get list of coin name that can be used as incentive reward for borrow incentive program

```typescript
const supportedRewardsName = scallopConstants.supportedBorrowIncentiveRewards(); // return Set<string>
```
