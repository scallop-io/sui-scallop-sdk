# Use Scallop Indexer

## Get Indexer Data

- Get pool-related data.

  ```typescript
  const scallopIndexer = await scallopSDK.createScallopIndexer();

  const market = await scallopIndexer.getMarket();
  const marketPools = await scallopIndexer.getMarketPools();
  const marketPool = await scallopIndexer.getMarketPool('sui');
  const marketCollaterals = await scallopIndexer.getMarketCollaterals();
  const marketCollateral = await scallopIndexer.getMarketCollateral('sui');
  const Spools = await scallopIndexer.getSpools();
  const Spool = await scallopIndexer.getSpool('ssui');
  const BorrowIncentivePools = await scallopIndexer.getBorrowIncentivePools();
  const BorrowIncentivePool =
    await scallopIndexer.getBorrowIncentivePool('sui');
  const tvl = await scallopIndexer.getTotalValueLocked();
  ```

