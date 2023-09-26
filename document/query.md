# Use ScallopQuery

## Query on-chain data

- Get data from lending contract.

  ```typescript
  // Get market data.
  const marketData = await scallopQuery.getMarket();
  // Get obligations data.
  const obligations = await scallopQuery.getObligations();
  // Get obligation data.
  const obligationData = await scallopQuery.getObligation(obligationId);
  ```

- Get data from spool contract.

  ```typescript
  // Get all stake accounts data.
  const allStakeAccounts = await scallopQuery.getAllStakeAccounts();
  // Get stake pool data.
  const stakePool = await scallopQuery.getStakePool(marketCoinName);
  // Get reward pool data.
  const rewardPool = await scallopQuery.getRewardPool(marketCoinName);
  ```
