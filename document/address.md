# Use Scallop Address (DEPRECATED)

> **Note:** This class is deprecated. Please use `ScallopConstants` instead, which exposes all `ScallopAddress` methods and properties via forwarders. See [constants.md](./constants.md) for usage.

#### `ScallopConstants` composes `ScallopAddress` (accessible via `constants.address`). Only `get`, `set`, `getAddresses`, `getAllAddresses`, and `switchCurrentAddresses` are forwarded on `ScallopConstants` for back-compat (`read` and `isSeeded` must be called on `constants.address`), and `constants instanceof ScallopAddress` is `false` — use `constants.address instanceof ScallopAddress` instead.

## Read Addresses

General Users will basically only use the `read`, `switchCurrentAddresses`, `get`, `getAddresses`, or `getAllAddresses` methods to read addresses. Here are some simple examples:

```typescript
const scallopAddress = new ScallopAddress({
  addressId: TEST_ADDRESSES_ID,
  network: NETWORK,
});

// Fetch addresses data from Scallop Addresses API.
await scallopAddress.read();
// Get the address in the nested address structure through the dot symbol.
const address = scallopAddress.get('core.coins.usdc.id');
// Set the address in the nested address structure through the dot symbol.
scallopAddress.set('core.coins.usdc.id', '0x...');
// Check whether addresses have been loaded for the current or specified network.
const isSeeded = scallopAddress.isSeeded();
// Get current addresses or specific network addresses of lending protocol.
const addresses = scallopAddress.getAddresses();
// Get all network addresses of lending protocol.
const allAddresses = scallopAddress.getAllAddresses();
// Synchronize addresses from addresses map of the specified network to the current addresses of instance.
const currentAddresses = scallopAddress.switchCurrentAddresses('testnet');
```

Scallop currently maintains this addresses id `695fcdc084f790c04eb068dc` for use in the production environment.

Of course, you can also directly use the [sui-scallop-api](https://github.com/scallop-io/sui-scallop-api) project to directly request addresses.
