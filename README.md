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

For the original codes, please refer to `test/index.spec.ts` file.

You need to setup the `.env` file before testing.

Remove the `.skip` to unskip the test.

- Setup the network

  ```typescript
  const NETWORK: NetworkType = 'testnet';
  ```

- Run the test

  ```bash
  pnpm run test:unit test/index.spec.ts
  ```

- Get Market Query Data

  ```typescript
  it('Should get market query data', async () => {
    const marketData = await client.queryMarket();
    console.info('marketData:', marketData);
    expect(!!marketData).toBe(true);
  });
  ```

- Open Obligation Account

  ```typescript
  it('Should open a obligation account', async () => {
    const openObligationResult = await client.openObligation();
    console.info('openObligationResult:', openObligationResult);
    expect(openObligationResult.effects.status.status).toEqual('success');
  });
  ```

- Get Obligations and Query Data

  ```typescript
  it('Should get obligations and its query data', async () => {
    const obligations = await client.getObligations();
    console.info('obligations', obligations);
    for (const { id } of obligations) {
      const obligationData = await client.queryObligation(id);
      console.info('id:', id);
      console.info('obligationData:');
      console.dir(obligationData, { depth: null, colors: true });
      expect(!!obligationData).toBe(true);
    }
  });
  ```

- Get Test Coin

  ```typescript
  it('Should get test coin', async () => {
    const mintTestCoinResult = await client.mintTestCoin('btc', 10 ** 11);
    console.info('mintTestCoinResult:', mintTestCoinResult);
    expect(mintTestCoinResult.effects.status.status).toEqual('success');
  });
  ```

- Deposit Collateral

  ```typescript
  it('Should depoist collateral successfully', async () => {
    const obligations = await client.getObligations();
    const depositCollateralResult = await client.depositCollateral(
      'btc',
      10 ** 11,
      true,
      obligations[0]?.id
    );
    console.info('depositCollateralResult:', depositCollateralResult);
    expect(depositCollateralResult.effects.status.status).toEqual('success');
  });
  ```

- Withdraw Collateral
  
    ⚠️Please note that due to the integration with Shinami Gas Station are still building, the features of Borrow Asset and Withdraw Collateral will now incur a Pyth Oracle fee of about 0.3~0.5 SUI.
  ```typescript
  it('Should withdraw collateral successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const withdrawCollateralResult = await client.withdrawCollateral(
      'eth',
      10 ** 10,
      true,
      obligations[0].id,
      obligations[0].keyId
    );
    console.info('withdrawCollateralResult:', withdrawCollateralResult);
    expect(withdrawCollateralResult.effects.status.status).toEqual('success');
  });
  ```

- Deposit Asset

  ```typescript
  it('Should depoist asset successfully', async () => {
    const depositResult = await client.deposit('usdc', 10 ** 10, true);
    console.info('depositResult:', depositResult);
    expect(depositResult.effects.status.status).toEqual('success');
  });
  ```

- Withdraw Asset

  ```typescript
  it('Should withdraw asset successfully', async () => {
    const withdrawResult = await client.withdraw('usdc', 5 * 10 ** 8, true);
    console.info('withdrawResult:', withdrawResult);
    expect(withdrawResult.effects.status.status).toEqual('success');
  });
  ```

- Borrow Asset
    ⚠️Please note that due to the integration with Shinami Gas Station are still building, the features of Borrow Asset and Withdraw Collateral will now incur a Pyth Oracle fee of about 0.3~0.5 SUI.
  ```typescript
  it('Should borrow asset successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const borrowResult = await client.borrow(
      'usdc',
      10 ** 9,
      true,
      obligations[0].id,
      obligations[0].keyId
    );
    console.info('borrowResult:', borrowResult);
    expect(borrowResult.effects.status.status).toEqual('success');
  });
  ```

- Repay Asset

  ```typescript
  it('Should repay asset successfully', async () => {
    const obligations = await client.getObligations();
    if (obligations.length === 0) throw Error('Obligation is required.');
    const repayResult = await client.repay(
      'usdc',
      10 ** 8,
      true,
      obligations[0].id
    );
    console.info('repayResult:', repayResult);
    expect(repayResult.effects.status.status).toEqual('success');
  });
  ```

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
