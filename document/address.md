# Use Scallop Address (DEPRECATED)

#### Scallop Address class has been merged as a parent class for Scallop Constants. You can call all Scallop Address methods and access its properties from Scallop Constants.

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
// Get current addresses or specific network addresses of lending protocol.
const addresses = scallopAddress.getAddresses();
// Get all network addresses of lending protocol.
const allAddresses = scallopAddress.getAllAddresses();
// Synchronize addresses from addresses map of the specified network to the current addresses of instance.
const currentAddresses = scallopAddress.switchCurrentAddresses('testnet');
```

Scallop currently maintains this addresses id `6462a088a7ace142bb6d7e9b` for use in the production environment.

Of course, you can also directly use the [sui-scallop-api](https://github.com/scallop-io/sui-scallop-api) project to directly request addresses.

## Write Addresses

The rest of the features are for Scallop administrators to use, and require a set of API authentication keys to use the create, update, and delete address functions.

```typescript
  const scallopAddress = new ScallopAddress({
    addressId: TEST_ADDRESSES_ID,
    auth: process.env.API_KEY,
    network: NETWORK,
  });

  // create addresses.
  const addresses = await scallopAddress.create({...});
  // Update addresses by id.
  const allAddresses = await scallopAddress.update({...});
  // delete addresses by id.
  const allAddresses = await scallopAddress.delete(id);
```
