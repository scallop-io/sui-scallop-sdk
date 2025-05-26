# Use ScallopQuery

## Core query

- Get asset or collateral pool data from market.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get both asset and collateral pools data from market. Use inspectTxn call to obtain the data provided in the scallop contract query module.
  const marketData = await scallopQuery.queryMarket();

  // Get multiple asset pools data. To obtain all market pools at once, it is recommended to use the `queryMarket` method to reduce time consumption.
  const marketPools = await scallopQuery.getMarketPools(['sui', 'wusdc']);

  // Get asset pool data separately.
  const suiMarketPool = await scallopQuery.getMarketPool('sui');

  // Get multiple collateral pools data. To obtain all market pools at once, it is recommended to use the `queryMarket` method to reduce time consumption.
  const marketCollaterals = await scallopQuery.getMarketCollaterals([
    'sui',
    'wusdc',
  ]);

  // Get collateral pool data separately.
  const suiMarketCollateral = await scallopQuery.getMarketCollateral('sui');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get obligation data.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get all obligation key and id from owner.
  const obligations = await scallopQuery.getObligations();

  // Use obligation id to get obligation data..
  const obligationData = await scallopQuery.queryObligation(obligations[0].id);

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get coin and market coin amount for owner. We also provide the way obtain coin price.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get all coin amount from owner.
  const coinAmounts = await scallopQuery.getCoinAmounts();

  // Get specific coin amount from owner.
  const coinAmount = await scallopQuery.getCoinAmount('sui');

  // Get all market coin amount from owner.
  const marketCoinAmounts = await scallopQuery.getMarketCoinAmounts();

  // Get specific market coin amount from owner.
  const marketCoinAmount = await scallopQuery.getMarketCoinAmount('ssui');

  // Get specific asset coin price.
  const usdcPrice = await scallopQuery.getPriceFromPyth('wusdc');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get Prices of all Supported Asset Coins

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const assetCoinsPrices = await scallopQuery.getPricesFromPyth(); // return Record<string, number>
  ```

## Spool query

- Get spool data.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get all spools data.
  const spools = await scallopQuery.getSpools();

  // Get multiple spools data.
  const spools = await scallopQuery.getSpools(['ssui', 'swusdc']);

  // Get spool data separately.
  const ssuiSpool = await scallopQuery.getSpool('ssui');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Stale methods, directly obtain the data of object fields.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get stake account for all spools.
  const allStakeAccounts = await scallopQuery.getAllStakeAccounts();

  // Get stake accounts for specific spool.
  const stakeAccounts = await scallopQuery.getStakeAccounts('ssui');

  // Get multiple stake pools data.
  const stakePools = await scallopQuery.getStakePools(['ssui', 'swusdc']);

  // Get stake pool data separately.
  const suiStakePool = await scallopQuery.getStakePool('ssui');

  // Get multiple reward pools data.
  const rewardPools = await scallopQuery.getStakeRewardPools([
    'ssui',
    'swusdc',
  ]);

  // Get reward pool data separately.
  const rewardPool = await scallopQuery.getStakeRewardPool('ssui');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

## Borrow Incentive Query

- Get All Borrow Incentive Pools

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const borrowIncentivePools = await scallopQuery.getBorrowIncentivePools();
  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

## Portfolio query

- Get user lending information include spool information.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get multiple lending information from owner.
  const lendings = await scallopQuery.getLendings(['sui', 'wusdc']);

  // Get lending information separately.
  const lending = await scallopQuery.getLending('sui');

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get user obligation account information include collateral and borrowing information.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get all obligation accounts information.
  const obligationAccounts = await scallopQuery.getObligationAccounts();

  // Get obligation account information separately.
  const obligations = await scallopQuery.getObligations();
  const obligationAccount = await scallopQuery.getObligationAccount(
    obligations[0].id
  );

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

- Get Scallop total value locked information.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // Get tvl that including total supply value and total borrow value.
  const tvl = await scallopQuery.getTvl();

  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

## VeSCA query

- Get veSCA treasury information

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const totalStakeVeSca = await scallopQuery.getVeScaTreasuryInfo(); // return string
  ```

- Get Binded Obligation ID from a veSCA key if it exists

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // get binded veScaKey
  const veScaKey = '0x...';
  const obligationId = await scallopQuery.getBindedVeScaKey(veScaKey); // return type string or null
  ```

- Get Binded veSCA Key from an Obligation ID if it exists

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  // get binded veScaKey
  const obligationId = '0x...';
  const veScaKey = await scallopQuery.getBindedVeScaKey(obligationId); // return type string or null
  ```

## Referral Query

- Get Referrer veSCA key from a referee wallet address if exists

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const refereeAdress = '0x...';
  const referrerVeScaKey =
    await scallopSDK.getVeScaKeyIdFromReferralBindings(refereeAddress); // return string or null
  ```

## veSCA Loyalty Program

- Get user veSCA loyalty program informations

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const loyaltyProgramInfos = await scallopQuery.getLoyaltyProgramInfos();
  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

## New SCoin Query

- Get sCoin total supply

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const sCoinName = 'ssui';
  const sCoinTotalSupply = await scallopQuery.getSCoinTotalSupply(sCoinName);
  ```

- Get sCoins amount in wallet

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const sCoinNames = ['ssui', 'swusdc'];
  const sCoinAmounts = await scallopQuery.getSCoinAmounts(sCoinNames, sender);
  ```

## Flashloan Fee

- Get flashloan fee

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const flashloanFees = await scallopQuery.getFlashLoanFees();
  // For the return type, please refer to the type definition of the source code, which is located in the project `src/types/query` folder location.
  ```

## Isolated Assets

- Get isolated assets

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const isolatedAssets = await scallopQuery.getIsolatedAssets(); // returns string[];
  ```

- Check if an asset is isolated

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const isolatedAssetName = 'deep';
  const isIsolated = await scallopQuery.isIsolatedAsset(isolatedAssetName); // returns boolean
  ```

## Portfolio

- Get user portfolio by wallet address

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  // Alternative
  // const scallopQuery = new ScallopQuery({})
  // await scallopQuery.init()
  const walletAddress = '0x...';
  const portfolio = await scallopQuery.getUserPortfolio({ walletAddress }); // returns user portfolio
  ```

## XOracle

- Get primary and secondary price update policy objects

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const policies = await scallopQuery.getPriceUpdatePolicies();
  // return { primary: SuiObjectResponse, secondary: SuiObjectResponse }
  ```

- Get primary and secondary oracles for all supported pool assets

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const oracles = await scallopQuery.getAssetOracles();
  /**
   * return
   *  {
   *    sui: {
   *      primary: ['pyth', ...],
   *      secondary: ['supra', ...]
   *    },
   *    usdc: {
   *      primary: [...],
   *    ...
   *  }
   */
  ```

- Get primary and secondary price update policy objects

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const { primary, secondary } = await scallopQuery.getPriceUpdatePolicies();
  ```