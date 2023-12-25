<p align="center">
  <a href="https://app.scallop.io">
    <img alt="scallop" src="https://i.imgur.com/g7Y4MIj.png" width="250" />
  </a>
</p>
<p align="center">
    <a style="padding-right: 5px;" href="https://github.com/scallop-io/sui-scallop-sdk/releases">
        <img alt="GitHub release" src="https://img.shields.io/github/v/release/scallop-io/sui-scallop-sdk?display_name=tag">
    </a>
    <a href="https://github.com/scallop-io/sui-scallop-sdk/blob/main/LICENSE">
        <img alt="GitHub licence" src="https://img.shields.io/github/license/scallop-io/sui-scallop-sdk?logoColor=blue">
    </a>
</p>

# The Typescript SDK for interacting with the Scallop lending protocol on the SUI network

## Description

This SDK is used to interact with [sui-lending-protocal](https://github.com/scallop-io/sui-lending-protocol) and is written based on another sui-integrated tool, [sui-kit](https://github.com/scallop-io/sui-kit). It consists of seven main functional models, here's a brief introduction to each of them:

- **Scallop**: Provide an entry to quickly create an instance (client, address, query, builder, utils) and complete initialization at the same time.

- **ScallopClient**: Helps users encapsulate basic operations for interacting with the contract. Once the instance is created, it can be called directly for use.

- **ScallopAddress**: Used to manage the addresses of the lending contract. It's prepackaged into the client and provides the addresses of mainly production environment for customers to query addresses, usually used in conjunction with the builder.

- **ScallopQuery**: Used to encapsulate all methods for querying on-chain data of the scallop contract. More useful information will be provided here in the future, such as lending, collateral, or borrowing portfolios.

- **ScallopBuilder**: Used for more detailed organization of the lending protocol's transaction blocks. You can build your own transaction combinations according to your needs by this model.

- **ScallopUtils**: Used to encapsulate some useful methods that will be used when interacting with the scallop contract.

- **ScallopIndexer**: It is used to query the on-chain index data through the SDK API. It is mainly used in query instances, effectively reducing the number of RPC requests..

## Pre-requisites

- Installation:
  ```bash
  pnpm install @scallop-io/sui-scallop-sdk
  ```
- Create an instance:

  ```typescript
  // Create an instance quickly through the`Scallop` class to construct other models.
  const scallopSDK = new Scallop({
      networkType: 'mainnet',
      ...
  });

  const scallopAddress = await scallopSDK.getScallopAddress(...);
  const scallopQuery = await scallopSDK.createScallopQuery(...);
  const scallopBuilder = await scallopSDK.createScallopBuilder(...);
  const scallopUtils = await scallopSDK.createScallopUtils(...);
  const scallopClient = await scallopSDK.createScallopClient(...);
  const scallopIndexer = await scallopSDK.createScallopIndexer();

  // Or, you can choose to import the class directly to create an instance.
  import {
    ScallopAddress,
    ScallopBuilder,
    ScallopQuery,
    ScallopUtils,
    ScallopIndexer,
    ScallopClient,
  } from '@scallop-io/sui-scallop-sdk'

  const scallopAddress = new ScallopAddress(...);
  const ScallopQuery = new ScallopQuery(...);
  const ScallopBuilder = new ScallopBuilder(...);
  const ScallopUtils = new ScallopUtils(...);
  const scallopClient = new ScallopClient(...);
  const ScallopIndexer = new ScallopIndexer();
  // Remember to initialize the instance before using it
  await scallopAddress.read();
  await ScallopQuery.init();
  await ScallopBuilder.init();
  await ScallopUtils.init();
  await scallopClient.init();
  ```

## Quick Guide for each model

Below we will give a brief introduction to these instances respectively, and introduce the functions through test codes.

- [Use Scallop Client](./document/client.md)
- [Use Scallop Query](./document/query.md)
- [Use Scallop Address](./document/address.md)
- [Use Scallop Builder](./document/builder.md)
- [Use Scallop Utils](./document/utils.md)
- [Use Scallop Indexer](./document/indexer.md)

For the original codes, please refer to `test` folder.

You need to set up the `.env` file before testing. (Reference `.env.example`)

- Run the test

  ```bash
  pnpm run test:unit test/index.spec.ts
  pnpm run test:unit test/address.spec.ts
  pnpm run test:unit test/builder.spec.ts
  pnpm run test:unit test/query.spec.ts
  pnpm run test:unit test/utils.spec.ts
  pnpm run test:unit test/indexer.spec.ts
  ```

## License

[APACHE-2.0](https://www.apache.org/licenses/LICENSE-2.0)
