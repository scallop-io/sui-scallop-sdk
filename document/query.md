# Use ScallopQuery

## Core Query

- Get market pools and collaterals.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const marketPools = await scallopQuery.getMarketPools(['sui', 'wusdc']);
  const suiMarketPool = await scallopQuery.getMarketPool('sui');
  const marketCollaterals = await scallopQuery.getMarketCollaterals([
    'sui',
    'wusdc',
  ]);
  const suiMarketCollateral = await scallopQuery.getMarketCollateral('sui');
  ```

- Get obligations and obligation details.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const obligations = await scallopQuery.getObligations();
  const obligationData = await scallopQuery.queryObligation(obligations[0].id);
  ```

- Get wallet balances and Pyth prices.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const coinAmounts = await scallopQuery.getCoinAmounts();
  const coinAmount = await scallopQuery.getCoinAmount('sui');

  const marketCoinAmounts = await scallopQuery.getMarketCoinAmounts();
  const marketCoinAmount = await scallopQuery.getMarketCoinAmount('ssui');

  const usdcPrice = await scallopQuery.getPriceFromPyth('wusdc');
  const prices = await scallopQuery.getPricesFromPyth(['sui', 'wusdc']); // Record<string, number>
  ```

## Spool Query

- Get spool data.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const spools = await scallopQuery.getSpools();
  const selectedSpools = await scallopQuery.getSpools(['ssui', 'swusdc']);
  const ssuiSpool = await scallopQuery.getSpool('ssui');
  ```

- Legacy stake/reward object-level methods (still available).

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const allStakeAccounts = await scallopQuery.getAllStakeAccounts();
  const stakeAccounts = await scallopQuery.getStakeAccounts('ssui');
  const stakePools = await scallopQuery.getStakePools(['ssui', 'swusdc']);
  const stakePool = await scallopQuery.getStakePool('ssui');
  const rewardPools = await scallopQuery.getStakeRewardPools([
    'ssui',
    'swusdc',
  ]);
  const rewardPool = await scallopQuery.getStakeRewardPool('ssui');
  ```

## Borrow Incentive Query

- Get borrow incentive pools.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const pools = await scallopQuery.getBorrowIncentivePools();
  ```

- Get borrow incentive accounts for an obligation.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const obligationId = '0x...';
  const incentiveAccounts =
    await scallopQuery.getBorrowIncentiveAccounts(obligationId);
  ```

## Lending, Obligation, TVL

- Get lending info.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const lendings = await scallopQuery.getLendings(['sui', 'wusdc']);
  const lending = await scallopQuery.getLending('sui');
  ```

- Get obligation account data.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const obligationAccounts = await scallopQuery.getObligationAccounts();
  const obligations = await scallopQuery.getObligations();
  const obligationAccount = await scallopQuery.getObligationAccount(
    obligations[0].id
  );
  ```

- Get TVL.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const tvl = await scallopQuery.getTvl();
  ```

## VeSCA Query

- Get veSCA treasury.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const treasury = await scallopQuery.getVeScaTreasuryInfo();
  ```

- Get binded obligation from a veSCA key.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const veScaKey = '0x...';
  const binded = await scallopQuery.getBindedObligation(veScaKey);
  // binded: { obligationId: string; obligationKey: string } | null
  ```

- Get binded veSCA key from an obligation id.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const obligationId = '0x...';
  const veScaKey = await scallopQuery.getBindedVeScaKey(obligationId); // string | null
  ```

- Get referral binding.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const refereeAddress = '0x...';
  const referrerVeScaKey =
    await scallopQuery.getVeScaKeyIdFromReferralBindings(refereeAddress); // string | null
  ```

- Get loyalty program info.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const loyaltyProgramInfos = await scallopQuery.getLoyaltyProgramInfos();
  const veScaLoyaltyInfos = await scallopQuery.getVeScaLoyaltyProgramInfos();
  ```

## sCoin Query

- Get sCoin supply and balances.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const sender = '0x...';

  const sCoinTotalSupply = await scallopQuery.getSCoinTotalSupply('ssui');
  const sCoinAmounts = await scallopQuery.getSCoinAmounts(
    ['ssui', 'swusdc'],
    sender
  );
  const sCoinAmount = await scallopQuery.getSCoinAmount('ssui', sender);
  ```

- Get sCoin swap rate.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const rate = await scallopQuery.getSCoinSwapRate('ssui', 'swusdc');
  ```

## Limits and Isolation

- Get pool limits.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const supplyLimit = await scallopQuery.getPoolSupplyLimit('sui');
  const borrowLimit = await scallopQuery.getPoolBorrowLimit('sui');
  ```

- Get isolated assets and check isolated status.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const isolatedAssets = await scallopQuery.getIsolatedAssets(); // default: indexer-backed
  const isolatedAssetsOnChain = await scallopQuery.getIsolatedAssets(true); // force on-chain

  const isIsolated = await scallopQuery.isIsolatedAsset('deep');
  const isIsolatedOnChain = await scallopQuery.isIsolatedAsset('deep', true);
  ```

## Oracle and Price Policies

- Get flashloan fees and all coin prices.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const flashloanFees = await scallopQuery.getFlashLoanFees();
  const allCoinPrices = await scallopQuery.getAllCoinPrices();
  ```

- Get xOracle policy objects and oracle mapping.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const policies = await scallopQuery.getPriceUpdatePolicies();
  // { primary: SuiObjectResponse | null, secondary: SuiObjectResponse | null }

  const oracles = await scallopQuery.getAssetOracles();
  /**
   * {
   *   sui: { primary: ['pyth', ...], secondary: ['supra', ...] },
   *   wusdc: { primary: [...], secondary: [...] }
   * }
   */
  ```

- Get Switchboard on-demand aggregator object ids.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();
  const aggObjectIds =
    await scallopQuery.getSwitchboardOnDemandAggregatorObjectIds(['sui']);
  ```

## Portfolio

- Get user portfolio by wallet address.

  ```typescript
  const scallopQuery = await scallopSDK.createScallopQuery();

  const walletAddress = '0x...';
  const portfolio = await scallopQuery.getUserPortfolio({ walletAddress });
  ```
