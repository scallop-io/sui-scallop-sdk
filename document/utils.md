# Use Scallop Utils

## Type Guard Methods

- Check if a coin is a Sui Bridge asset.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();
  const isSuiBridge = scallopUtils.isSuiBridgeAsset('weth');
  ```

- Check if a coin is a Wormhole asset.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();
  const isWormhole = scallopUtils.isWormholeAsset('wusdc');
  ```

- Check if a coin name is a market coin (sCoin).

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();
  const isMarket = scallopUtils.isMarketCoin('ssui'); // true
  const isNotMarket = scallopUtils.isMarketCoin('sui'); // false
  ```

## Some common conversion methods for coin name supported by Scallop

- It can parse to the symbol from coin and market coin (sCoin) name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  // Supports conversion from coin and market coin names
  const usdcSymbol = scallopUtils.parseSymbol('wusdc');
  const ssuiSymbol = scallopUtils.parseSymbol('ssui');
  ```

- It can parse to coin type from coin or market coin name. These methods deal with
  wormhole's coins so that they can correctly find the corresponding type.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  // Supports conversion from coin and market coin names
  const suiCoinType = scallopUtils.parseCoinType('sui');
  const usdcCoinType = scallopUtils.parseCoinType('wusdc');
  const usdtCoinType = scallopUtils.parseCoinType('swusdt');
  ```

- It can parse to market coin type from coin or market coin name. These methods deal with
  wormhole's coins so that they can correctly find the corresponding type.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  // Supports conversion from coin and market coin names
  const suiMarketCoinType = scallopUtils.parseMarketCoinType('sui');
  const usdcMarketCoinType = scallopUtils.parseMarketCoinType('wusdc');
  const usdtMarketCoinType = scallopUtils.parseMarketCoinType('swusdt');
  ```

- It can parse to coin or market coin name from coin, coin object, market or market object type. This method deals with wormhole's coins so that it can correctly find the corresponding name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const suiCoinName = scallopUtils.parseCoinName('0x2::sui::SUI');
  const suiCoinName = scallopUtils.parseCoinNameFromType(
    '0x2::coin::Coin<0x2::sui::SUI>'
  );
  const usdcCoinName = scallopUtils.parseCoinNameFromType(
    '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'
  );
  const usdcMarketCoinName = scallopUtils.parseCoinNameFromType(
    '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::reserve::MarketCoin<0x2::sui::SUI>'
  );
  const suiMarketCoinName = scallopUtils.parseCoinNameFromType(
    '0x2::coin::Coin<0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::reserve::MarketCoin<0x2::sui::SUI>>'
  );
  ```

- It can parse from the coin name to the market coin name, and conversely, it can also parse from the market coin name to the coin name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const usdcCoinName = scallopUtils.parseCoinName('swusdc');
  const usdcMarketCoinName = scallopUtils.parseMarketCoinName('wusdc');
  ```

## sCoin Conversion Methods

- Convert coin name to sCoin name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const sCoinName = scallopUtils.parseSCoinName('sui'); // 'ssui'
  const alreadySCoin = scallopUtils.parseSCoinName('ssui'); // 'ssui'
  ```

- Convert sCoin type name (e.g., `scallop_sui`) to market coin name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const marketCoinName =
    scallopUtils.parseSCoinTypeNameToMarketCoinName('scallop_sui');
  // Returns: 'ssui'
  ```

- Convert sCoin name to sCoin type.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const sCoinType = scallopUtils.parseSCoinType('ssui');
  ```

- Convert sCoin type to sCoin name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const sCoinName = scallopUtils.parseSCoinNameFromType(sCoinType);
  ```

- Get the underlying coin type from sCoin name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const underlyingType = scallopUtils.parseUnderlyingSCoinType('ssui');
  // Returns the SUI coin type
  ```

- Get sCoin treasury ID from sCoin name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const treasuryId = scallopUtils.getSCoinTreasury('ssui');
  ```

## Some other useful methods supported by Scallop

- It can get the spool reward coin name (currently always returns 'sui').

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();
  const rewardCoinName = scallopUtils.getSpoolRewardCoinName();
  // Returns: 'sui'
  ```

- It can using asset coin name to get wrapped coin type.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const suiCoinWrapType = scallopUtils.getCoinWrappedType('sui');
  const usdcCoinWrapType = scallopUtils.getCoinWrappedType('wusdc');
  ```

- It can getting coin object ids within the selected coin amount range.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();
  const suiCoinType = await scallopUtils.parseCoinType('sui');
  const suiMarketCoinType = await scallopUtils.parseMarketCoinType('ssui');

  // Supports conversion from coin and market coin types.
  const suiCoinObjectIds = await scallopUtils.selectCoins(
    1000000000,
    suiCoinType
  );
  const suiMarketCoinObjectIds = await scallopUtils.selectCoins(
    1,
    suiMarketCoinType
  );
  ```

- It can getting all asset coin names from obligation account.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const obligations = await client.getObligations();
  const assetCoinNames = await scallopUtils.getObligationCoinNames(
    obligations[0].id
  );
  ```

- It can getting all asset coin prices.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const coinPrices = await scallopUtils.getCoinPrices();
  const usdcCoinPrice = (await scallopUtils.getCoinPrices(['wusdc']))['wusdc'];
  ```

- Get coin decimal for a specific coin.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const suiDecimal = scallopUtils.getCoinDecimal('sui'); // 9
  const usdcDecimal = scallopUtils.getCoinDecimal('wusdc'); // 6
  ```

- Convert APR to APY.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  // Default compound frequency is 365 (daily)
  const apy = scallopUtils.parseAprToApy(0.05); // 5% APR to APY
  const apyHourly = scallopUtils.parseAprToApy(0.05, 8760); // Hourly compounding
  ```

- Convert APY to APR.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const apr = scallopUtils.parseApyToApr(0.0513); // APY to APR
  ```

## veSCA Related Methods

- Calculate unlock timestamp for veSCA lock period.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  // Get unlock timestamp for new lock (extend by 30 days)
  const unlockAt = scallopUtils.getUnlockAt(30);

  // Extend existing lock period
  const existingUnlockTimestamp = 1700000000000; // ms
  const newUnlockAt = scallopUtils.getUnlockAt(30, existingUnlockTimestamp);
  ```

## Pool Information Methods

- Get all supported pool addresses with detailed contract information.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const poolAddresses = scallopUtils.getSupportedPoolAddresses();
  // Returns array of PoolAddress objects with coinName, symbol, coinType, etc.
  ```
