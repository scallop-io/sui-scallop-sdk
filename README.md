<p align="center">
  <a href="https://app.scallop.io">
    <img alt="scallop" src="https://i.imgur.com/g7Y4MIj.png" width="250" />
  </a>
</p>
<p align="center">
    <a style="padding-right: 5px;" href="https://github.com/scallop-io/sui-scallop-sdk/releases">
        <img alt="GitHub release" src="https://img.shields.io/github/v/release/@scallop-io/sui-scallop-sdk?display_name=tag">
    </a>
    <a href="https://github.com/scallop-io/sui-scallop-sdk/blob/main/LICENSE">
        <img alt="NPM" src="https://img.shields.io/npm/l/@scallop/sdk?registry_uri=https%3A%2F%2Fnpm.pkg.github.com%2F">
    </a>
</p>

# The Typescript SDK for interacting with Scallop lending protocol on SUI network

## Description

This SDK is used to interact with [sui-lending-protocal](https://github.com/scallop-io/sui-lending-protocol) and is written based on another sui-integrated tool, [sui-kit](https://github.com/scallop-io/sui-kit). It consists of three main functional modules, namely **Scallop Client**, **Scallop Address**, and **Scallop txBuilder**. Here's a brief introduction to each of them:

- **Client**: Helps users encapsulate basic operations for interacting with the contract. Once the instance is created, it can be called directly for use.

- **Address**: Used to manage the addresses of the lending contract. It's prepackaged into the client and provides the addresses of mainly production environment for customers to query addresses, usually used in conjunction with the builder.

- **Builder**: Used for more detailed organization of the lending protocol's transaction blocks. You can build your own transaction combinations according to your needs by this model.

# How to use

## Pre-requisites

- Installation:
  ```bash
  pnpm install @scallop-io/sui-scallop-sdk
  ```
- Create an instance:

  ```typescript

  // Create an instance quickly through the`Scallop` class to construct other models.
  const sdk = new Scallop({
      networkType: 'testnet',
      ...
  })

  const client = sdk.createScallopClient(...);
  const address = sdk.createAddress(...);
  const txBuilder = sdk.createTxBuilder(...);

  // Or, you can choose to import the class directly to create an instance.
  import {
    ScallopClient,
    ScallopTxBuilder,
    ScallopAddress,
  } from '@scallop-io/sui-scallop-sdk'

  const client = new ScallopClient(...);
  const address = new ScallopTxBuilder(...);
  const txBuilder = new ScallopAddress(...);

  ```

## Use Client

For detailed examples, please refer to the code in `tests/index.ts` file.

## Use address manager

General Users will basically only use the `get`, `getAddresses` or `getAllAddresses` methods to read addresses. Here are some simple examples:

```typescript
const address = new ScallopAddress({
  id: TEST_ADDRESSES_ID,
  network: NETWORK,
});

// Fetch addresses data from scallop sui API.
await addressBuilder.read();
// Get the address in the nested address structure through the dot symbol.
const address = addressBuilder.get('core.coins.usdc.id');
// Get specific network addresses of lending protocol.
const addresses = addressBuilder.getAddresses();
// Get all network addresses of lending protocol.
const allAddresses = addressBuilder.getAllAddresses();
```

Scallop currently maintains this address `645f2a57a7ace142bb6d7c17` for use in the production environment.

Of course, you can also directly use the [sui-scallop-api](https://github.com/scallop-io/sui-scallop-api) project to directly request an addresses.

The rest of the features are for Scallop administrators to use, and require a set of API authentication key to use the create, update, and delete address functions.

```typescript
  const address = new ScallopAddress({
    id: TEST_ADDRESSES_ID,
    auth: process.env.API_KEY,
    network: NETWORK,
  });

  // create addresses.
  const addresses = await addressBuilder.create(...);
  // Update addresses by id.
  const allAddresses = await addressBuilder.update(id, ...);
  // delete addresses by id.
  const allAddresses = await addressBuilder.delete(id, ...);
```

## Use TransactionBlock Builder

Currently no usage examples here.

# License

[APACHE-2.0](https://www.apache.org/licenses/LICENSE-2.0)
