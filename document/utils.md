# Use ScallopUtils

## Some common conversion methods for coin name supported by Scallop

- It can parse to the symbol from coin and market coin (sCoin) name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  // Supports conversion from coin and market coin names
  const usdcSymbol = scallopUtils.parseSymbol('usdc');
  const ssuiSymbol = scallopUtils.parseSymbol('ssui');
  ```

- It can parse to coin type from coin or market coin name. These methods deal with
  wormhole's coins so that they can correctly find the corresponding type.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  // Supports conversion from coin and market coin names
  const suiCoinType = scallopUtils.parseCoinType('sui');
  const usdcCoinType = scallopUtils.parseCoinType('usdc');
  const usdtCoinType = scallopUtils.parseCoinType('susdt');
  ```

- It can parse to market coin type from coin or market coin name. These methods deal with
  wormhole's coins so that they can correctly find the corresponding type.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  // Supports conversion from coin and market coin names
  const suiMarketCoinType = scallopUtils.parseMarketCoinType('sui');
  const usdcMarketCoinType = scallopUtils.parseMarketCoinType('usdc');
  const usdtMarketCoinType = scallopUtils.parseMarketCoinType('susdt');
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

  const usdcCoinName = scallopUtils.parseCoinName('susdc');
  const usdcMarketCoinName = scallopUtils.parseMarketCoinName('usdc');
  ```

## Some other useful methods supported by Scallop

- It can using stake market coin name to get reward coin name.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();
  const rewardCoinName = scallopUtils.getRewardCoinName('susdc');
  ```

- It can using asset coin name to get wrapped coin type.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();

  const suiCoinWrapType = scallopUtils.getCoinWrappedType('sui');
  const usdcCoinWrapType = scallopUtils.getCoinWrappedType('usdc');
  ```

- It can getting coin object ids within the selected coin amount range.

  ```typescript
  const scallopUtils = await scallopSDK.createScallopUtils();
  const suiCoinType = await scallopUtils.parseCoinType('sui');
  const suiMarketCoinType = await scallopUtils.parseMarketCoinType('ssui');

  // Supports conversion from coin and market coin types.
  const suiCoinObjectIds = await scallopUtils.selectCoinIds(
    1000000000,
    suiCoinType
  );
  const suiMarketCoinObjectIds = await scallopUtils.selectCoinIds(
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
  const usdcCoinPrice = (await scallopUtils.getCoinPrices(['usdc']))['usdc'];
  ```
