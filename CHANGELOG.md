# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.1.6](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.1.5...v2.1.6) (2025-05-09)

- Minor fix ([1464074](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/1464074dce10fa69421c4f7f301f2b04d7f9aed0))

### [2.1.5](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.1.4...v2.1.5) (2025-05-09)

- Minor fix ([b37a733](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/b37a733c0f19e27bca8120e96ac8d04d8978ccda))

### [2.1.4](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.1.3...v2.1.4) (2025-05-09)

- Use now price instead of time-weighted price for Pyth price ([aaed310](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/aaed310cc22a5d328af926e88fbec1110e52022d))

### [2.1.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.1.2...v2.1.3) (2025-05-09)

### Bugfixes

- Fix lock sca logic bug ([39572fb](https://github.com/scallop-io/sui-scallop-sdk/pull/257/commits/39572fb8a2cd54202382d6f0b36e191954073623))

### Features

Add support for merging and splitting veSCA keys.

### [2.1.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.1.1...v2.1.2) (2025-05-06)

### Bugfixes

- Minor bugfix ([51a58a9](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/51a58a9bc0548a133ff50f4da989a057390cd59d))

### [2.1.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.1.0...v2.1.1) (2025-05-04)

### Bugfixes

- Minor bugfix ([f6579de](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/f6579deefc33ef6e472b99dda0a5f01125ae5a29))

### [2.1.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.12...v2.1.0) (2025-05-03)

### ⚠ BREAKING CHANGES

Starting from `v2.1.0`, `Scallop Address` class has been merged into `Scallop Constants` class as its superclass. All methods previously available in `Scallop Address` can now be accessed directly from `Scallop Constants` class.

- Refactor classes structure ([923f5ff](https://github.com/scallop-io/sui-scallop-sdk/pull/258/commits/923f5ff1c5d5b5927c813859cc78b6a58c7001dd))

- Remove unused packages and upgrade `@mysten/sui` package ([e150a17](https://github.com/scallop-io/sui-scallop-sdk/pull/258/commits/e150a17c4c4bccf830bd14a7a540d79400c53e80))

### [2.0.12](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.11...v2.0.12) (2025-04-01)

### Features

- Add more strict rate limiter class in `ScallopCache`([c3eddb4](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/c3eddb44e721b336c2307c7cf362ef79ad1d5ce0))

### [2.0.11](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.10...v2.0.11) (2025-03-31)

### Bugfixes

- Handle boolean values when parsing pool addresses values ([b713bb1](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/b713bb13d5aff02390cd8f80d8e520199197e9e2))

### [2.0.10](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.9...v2.0.10) (2025-03-31)

### Features

- Add `isIsolated` to `PoolAddress` interface to ensure backward compatibility ([e62bc06](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/e62bc06637f6c1c992ad1687eb51e69903bb3262))

### [2.0.9](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.8...v2.0.9) (2025-03-31)

### Features

- Add `emerging` to whitelist ([6900254](https://github.com/scallop-io/sui-scallop-sdk/pull/254/commits/6900254ce902351d730460ad3f9bec91f65d9262))

### [2.0.8](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.7...v2.0.8) (2025-03-31)

### Bugfixes

- Add `walletAddress` as parameter ([535e381](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/535e3819e727b5407dbaf86bd233a951268342e2))

### [2.0.7](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.6...v2.0.7) (2025-03-26)

### Bugfixes

- minor bug fixes ([aa59980](https://github.com/scallop-io/sui-scallop-sdk/pull/245/commits/aa59980ab65032ce7d4892990ad941fa0c6f3959))

### [2.0.6](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.5...v2.0.6) (2025-03-23)

### Features

- add `selectSCoinOrMarketCoin` function and use it on `withdrawQuick` ([e888676](https://github.com/scallop-io/sui-scallop-sdk/commit/e8886766ab865331e9a9467f27653c79c85413ac))

### Bugfixes

- fix `coinNameToOldMarketCoinTypeMap` logic ([0384be0](https://github.com/scallop-io/sui-scallop-sdk/commit/0384be08d764c9d3a5a0f9c41ea83d0a887385ff))
- scallop cache init param ([87b4869](https://github.com/scallop-io/sui-scallop-sdk/commit/87b4869f063887168c9a1cbe35e95d8f95d5ae12))

### [2.0.5](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.4...v2.0.5) (2025-03-21)

### Features

- fix lending pending rewards ([d084e41](https://github.com/scallop-io/sui-scallop-sdk/pull/249/commits/d084e41749085c63cba04df9bf31a41b0ad6af45))

### [2.0.4](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.3...v2.0.4) (2025-03-20)

### Features

- add collateral details in portfolio query ([eef0a2e](https://github.com/scallop-io/sui-scallop-sdk/commit/eef0a2e9c73e97d62e56622575efdda0be49320f))

### [2.0.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.2...v2.0.3) (2025-03-20)

### Bug Fixes

- update filter logic in getUserPortfolio to include accounts with positive totalDepositedValue ([9163326](https://github.com/scallop-io/sui-scallop-sdk/commit/916332600d51b9d3507586ca5b08fb425f6b864c))

- make suiKit params optional ([c79890c](https://github.com/scallop-io/sui-scallop-sdk/pull/247/commits/c79890cc8d6a808e6b836dda37020187ba916476))

### [2.0.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.1...v2.0.2) (2025-03-19)

### [2.0.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v2.0.0...v2.0.1) (2025-03-18)

### Features

- Add `getScallopConstants` method ([972250c](https://github.com/scallop-io/sui-scallop-sdk/pull/244/commits/972250ccfd633c4e92dd341b3ed0496c55dd88ad))
- Update README and add documentation for `ScallopConstants` ([51bfaf8](https://github.com/scallop-io/sui-scallop-sdk/pull/244/commits/51bfaf82a4d0be326f57f5506ebef51d04177019))

### ⚠ BREAKING CHANGES

Starting from `v2.0.0`, all constants in the Scallop SDK will be replaced by the `ScallopConstants` class. This class dynamically fetches necessary data from the API, allowing assets to be added or removed without requiring an SDK upgrade for each new pool.

### [2.0.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.5.3...v2.0.0) (2025-03-17)

### Features

- Add `ScallopConstants` class
- Adjust structure to use `ScallopConstants` class

### [1.5.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.5.2...v1.5.3) (2025-03-03)

### Features

- Minor fix

### [1.5.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.5.1...v1.5.2) (2025-03-03)

### Features

- Update address id to `675c65cd301dd817ea262e76` ([767c09f](https://github.com/scallop-io/sui-scallop-sdk/pull/232/commits/767c09f960f738e6f433f3f93646a6357004dbdf))

### [1.5.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.5.0...v1.5.1) (2025-03-03)

### Features

- Allow to query oracle list on-chain ([a50e85c](https://github.com/scallop-io/sui-scallop-sdk/pull/240/commits/a50e85c8dd702c3af6109e1f41b67a8c7735b21f))

### [1.5.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.27...v1.5.0) (2025-02-28)

### ⚠ BREAKING CHANGES

Starting from `v1.5.0`, Scallop SDK will use `xOracle V2`. Further development will continue from this version onward. Any version below this version is deprecated.

### [1.4.27](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.26...v1.4.27) (2025-02-27)

### Features

- Fix available deposit / borrow calc

### [1.4.26](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.25...v1.4.26) (2025-02-24)

### Features

- Add `usdy` pool

### [1.4.25](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.24...v1.4.25) (2025-02-21)

### Features

- Add `ns` as isolated asset ([ed4c222](https://github.com/scallop-io/sui-scallop-sdk/pull/236/commits/ed4c2220f3eee780da7a37e324848c7fc409bb7b))

### [1.4.24](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.23...v1.4.24) (2025-02-19)

### Features

- Add `mUSD` as isolated asset
- Optimize build result

### [1.4.23](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.22...v1.4.23) (2025-02-08)

### Features

- Fix sui bridge wormhole symbol coin format ([523e523](https://github.com/scallop-io/sui-scallop-sdk/commit/523e523d627c3824d490a98e5ac53f73e6670340))

### [1.4.22](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.21...v1.4.22) (2025-02-06)

### Features

- Add `sbwBTC` pool support ([f5979d8](https://github.com/scallop-io/sui-scallop-sdk/pull/232/commits/f5979d88387226d440722b3adad997d6a17fffd6))

### [1.4.21](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.20...v1.4.21) (2025-01-24)

### Features

- Add $BLUB as isolated asset

### [1.4.20](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.19...v1.4.20) (2025-01-19)

### Features

- Add TotalLendingSupply and TotalCollateralSupply ([83c7aa0](https://github.com/scallop-io/sui-scallop-sdk/pull/230/commits/83c7aa0c9c729703c7a0e81ed820416b34932417))

### [1.4.19](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.18...v1.4.19) (2025-01-09)

### Features

- Add `decimals` to `poolAddressQuery` ([469a631](https://github.com/scallop-io/sui-scallop-sdk/pull/229/commits/469a6310981c23b2129dbbfab1e1f82acce0a651))

### [1.4.18](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.17...v1.4.18) (2025-01-08)

### Features

- Update `poolAddressQuery.ts` ([e37e3c9](https://github.com/scallop-io/sui-scallop-sdk/pull/229/commits/e37e3c93566c005893ffc3b2bb7028bfe1501aad))

### [1.4.17](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.16...v1.4.17) (2025-01-07)

### Bugfix

- Fix bad-debt risk level calculation ([65136d5](https://github.com/scallop-io/sui-scallop-sdk/pull/229/commits/65136d532ffb13490dc4c194011e10ee1cef4779))

### [1.4.16](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.10...v1.4.16) (2025-01-02)

### Bugfix

- Fix `mergeSimilarCoins` dest type ([b428748](https://github.com/scallop-io/sui-scallop-sdk/pull/226/commits/b428748744a158897d49a57b8546df546ff18cf3))

### [1.4.10](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.9...v1.4.10) (2024-12-31)

### Features

- Use `deepMergeObject` instead of replacing cache in `ScallopCache` ([bbb6683](https://github.com/scallop-io/sui-scallop-sdk/pull/226/commits/bbb6683a4222e065fe6cec80b6f36bc22e8ba195))

### [1.4.9](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.8...v1.4.9) (2024-12-30)

### Features

- Add support `sbUSDT` and `ssbUSDT` ([5a510ec](https://github.com/scallop-io/sui-scallop-sdk/pull/226/commits/5a510ec4bc8107387a89edfb33c84c6d53daee0c))

### [1.4.8](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.7...v1.4.8) (2024-12-29)

### Features

- Adjust `getUserPortfolio` return structure ([1ad951da](https://github.com/scallop-io/sui-scallop-sdk/pull/226/commits/1ad951dafd4033e89b9cfd6bc49f039e191d6b5c))

### [1.4.7](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.6...v1.4.7) (2024-12-28)

### Features

- Add `getUserPortfolio` into `scallopQuery` ([ce63c7a](https://github.com/scallop-io/sui-scallop-sdk/pull/226/commits/ce63c7a967d46e296ac74b74ea5fbf750434cf64))
- Merge `tokenBucket` functionality into `scallopCache` ([85d8ef6](https://github.com/scallop-io/sui-scallop-sdk/pull/226/commits/85d8ef653368fc70d022c0c35ff41906f7f7de47))

### [1.4.6](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.5...v1.4.6) (2024-12-25)

### Bugfixes

- Set fallback value to `undefined` ([36a47f4](https://github.com/scallop-io/sui-scallop-sdk/pull/221/commits/36a47f4cd79498f3675a5660f2c95114762662ae))

### [1.4.5](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.4...v1.4.5) (2024-12-24)

### Features

- Add FDUSD

### [1.4.4](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.3...v1.4.4) (2024-12-22)

### Features

- Minor refactor ([4395985](https://github.com/scallop-io/sui-scallop-sdk/pull/219/commits/439598585eccee10f8ad1e851327c7b170eb5f86)) ([5af05de](https://github.com/scallop-io/sui-scallop-sdk/pull/219/commits/5af05ded0e76015c5c0f95c3812b14aa10bd058a))

### [1.4.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.2...v1.4.3) (2024-12-22)

### Adjusments

- Revert some features

### [1.4.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.14...v1.4.2) (2024-12-22)

### Bugfixes

- Fix sCoin price not showing ([9aef4aa](https://github.com/scallop-io/sui-scallop-sdk/pull/217/commits/9aef4aa90ac6ee7628d8b9e530bc08b921e014ea))

- Optimize and reduce overall rpc calls

### [1.4.14](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.13...v1.4.14) (2024-12-17)

### Bugfixes

- Minor bugfix ([23e45f4](https://github.com/scallop-io/sui-scallop-sdk/commit/23e45f48df6779fb965e99d4daff9aa6ee37112d))

### [1.4.13](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.12...v1.4.13) (2024-12-17)

### Bugfixes

- Fix `SUPPORT_BORROW_INCENTIVES` constants ([6904e80](https://github.com/scallop-io/sui-scallop-sdk/commit/6904e80cea19c4c3fec0980dace8d0a7fa063ad1))

### [1.4.12](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.11...v1.4.12) (2024-12-17)

### Bugfixes

- Fix $FUD and $DEEP `availableRepayCoin` ([6f39c06](https://github.com/scallop-io/sui-scallop-sdk/commit/6f39c06e423e0c56f7daec63ca28c92e560c6d97))

### [1.4.11](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.1...v1.4.11) (2024-12-16)

### Bugfixes

- Fix `name` from `parseOriginBorrowIncentivePoolData` method ([53c219d](https://github.com/scallop-io/sui-scallop-sdk/commit/53c219daeb9a5b25ad5541890a0dbc3f59d3bf65))

- Reduce rate limit

### [1.4.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.4.0...v1.4.1) (2024-12-16)

### ⚠ BREAKING CHANGES

- Breaking changes for `claimBorrowIncentives` and `parseCoinType` methods ([21dfc91](https://github.com/scallop-io/sui-scallop-sdk/pull/210/commits/21dfc91d450a93e73eea2c83a15044fc6be9d20f))

- Remove `getBorrowIncentiveRewardCoinName` ([21dfc91](https://github.com/scallop-io/sui-scallop-sdk/pull/210/commits/21dfc91d450a93e73eea2c83a15044fc6be9d20f))

- Allow dynamic reward coins for borrow incentive

### [1.4.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.3.4...v1.4.0) (2024-12-16)

### ⚠ BREAKING CHANGES

- All `indexer` parameters are moved into object parameters called `args` ([0112d9a](https://github.com/scallop-io/sui-scallop-sdk/commit/0112d9a8cf2013a54f7ce82cb742c77ab81504fd))

### [1.3.4](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.3.3...v1.3.4) (2024-12-14)

### ⚠ BREAKING CHANGES

### Features

- Add `getSupportedPoolAddresses` in `ScallopUtils` ([4aab3bd](https://github.com/scallop-io/sui-scallop-sdk/commit/4aab3bdfb1b3fa7354876ad1ae43aaaacf9a06f0))
- Add `deep` and `fud` as isolated assets ([512125d](https://github.com/scallop-io/sui-scallop-sdk/pull/207/commits/512125dd5c547e7d6efb750d84f2f1ed52b4dbd0))
- Add borrow limit ([c32bd39](https://github.com/scallop-io/sui-scallop-sdk/pull/207/commits/c32bd393909a31aee6f78199d285b20f4c330fbb))

- Change borrow incentive rewards type from `[sui, sca]` to `[ssui, ssca]` ([67e4d6d](https://github.com/scallop-io/sui-scallop-sdk/commit/67e4d6d7168c95d0fce0b5dea20af581e7d69738))

### [1.3.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.3.2...v1.3.3) (2024-11-25)

### Features

- Add new function `getCoinPrice` using indexer ([e6fe81e](https://github.com/scallop-io/sui-scallop-sdk/pull/201/commits/1ff66703a9cbd28e2cd3a8d325348b873e6fe81e))

- Use `stakeObligationWithVeScaQuick` where possible in scallopClient ([e4c95bd](https://github.com/scallop-io/sui-scallop-sdk/pull/201/commits/e4c95bd383d645a2471aa12a50a4955efdc1f570))

- Add `sCoinType` to spool and lending query ([e28d93f](https://github.com/scallop-io/sui-scallop-sdk/pull/201/commits/e28d93f1d5689973e2303fc89256cb169817f735))

- Add `getCoinPriceByIndexer` to scallopQuery ([3259f0d](https://github.com/scallop-io/sui-scallop-sdk/pull/201/commits/3259f0dcb9eb49acf1e41ebf7aa38aff5469ddae))

### [1.3.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.3.1...v1.3.2) (2024-11-06)

### Features

- Add optional params for `queryKeys` ([9db4963](https://github.com/scallop-io/sui-scallop-sdk/pull/198/commits/9db4963ebcab36dc6862e020af986f39bdf00f73))

- Disable `isIsolatedAsset` query temporarily ([d9d6284](https://github.com/scallop-io/sui-scallop-sdk/pull/198/commits/d9d62842f7cd470b3a409c3abb548dba91761aa4))

### Bugfixes

- Remove unnecessary `queryGetObjects` ([0a0d4d1](https://github.com/scallop-io/sui-scallop-sdk/pull/198/commits/0a0d4d15ea390d4f0b121dae4a4f7b8e12f8c822))
- Fix query never invalidate if `staleTime` or `gcTime` is Infinity ([61927c1](https://github.com/scallop-io/sui-scallop-sdk/pull/198/commits/61927c1c2546b2c87b0d10d3b81acb9758f1035c))

### [1.3.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v1.3.0...v1.3.1) (2024-11-04)

### Features

- Add `gcTime` to `scallopCache` ([c138ef4](https://github.com/scallop-io/sui-scallop-sdk/pull/195/commits/c138ef49603fba86335e0b6012830992848e547d)) ([d3a4361](https://github.com/scallop-io/sui-scallop-sdk/pull/195/commits/d3a436127307a69899ed71cff08b31a81848b941))

### [1.3.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.7...v1.3.0) (2024-11-01)

### ⚠ BREAKING CHANGES

Starting from `v1.3.0`, Scallop SDK will use `@mysten/sui@1.3.0`. Further development will continue from this version onward

### [0.47.7](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.6...v0.47.7) (2024-10-28)

### Features

- Add fallback to onchain-data mechanism for methods that support indexer calls ([71b3de2](https://github.com/scallop-io/sui-scallop-sdk/pull/188/commits/71b3de2cdb9082731989fd20df75bbbe2530c7cf))
- Add missing `forceAddress` parameters ([3d24a39](https://github.com/scallop-io/sui-scallop-sdk/pull/188/commits/3d24a39adfb96fe039fa96a39e6158d215c08804))

### [0.47.6](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.5...v0.47.6) (2024-10-22)

### Features

- Add option `forceAddressesInterface` ([c66a64b](https://github.com/scallop-io/sui-scallop-sdk/commit/c66a64b93a85cc1ff9e3e479c61b0fe4fcbe07e7))

### [0.47.5](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.4...v0.47.5) (2024-10-21)

### Features

- Add `sbeth` (Sui Bridged ETH) ([0e2f2cf](https://github.com/scallop-io/sui-scallop-sdk/pull/180/commits/0e2f2cf5710c737af1d615f66bd175eb929c455c))

### [0.47.4](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.3...v0.47.4) (2024-10-21)

### Features

- Allow exclude empty veSca in `getVeScas` method ([d636ff1](https://github.com/scallop-io/sui-scallop-sdk/commit/d636ff1549988776cd9ac5eaa21ac067175ba15b))

### [0.47.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.2...v0.47.3) (2024-10-18)

### Features

- Add `usePythPullModel` to scallop params

### [0.47.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.1...v0.47.2) (2024-10-12)

### Bugfix

- Fix error on veScaKey selection logic in `stakeObligationWithVeScaQuick` method ([5f3324b](https://github.com/scallop-io/sui-scallop-sdk/pull/176/commits/5f3324b70e48f488522aaa44ca1474fe9735f501))

### [0.47.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.0...v0.47.1) (2024-10-08)

### Bugfix

- Minor fix ([ec5a83](https://github.com/scallop-io/sui-scallop-sdk/pull/175/commits/ec5a838934a5f05bd61c7ed9b3a77659b6d60719))

### [0.47.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.0-alpha.6...v0.47.0) (2024-10-08)

### ⚠ BREAKING CHANGES

- Refactor the entire naming for wormhole wrapped coin. For example:
  - sol -> wsol; ssol -> swsol
  - apt -> wapt; sapt -> swapt
  - btc -> wbtc; sbtc -> swbtc
  - eth -> weth; seth -> sweth
  - usdc -> wusdc; susdc -> swusdc
  - usdt -> wusdt; susdt -> swusdt
- 'usdc' and 'susdc' naming will be reserved for native USDC

### [0.47.0-alpha.6](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.0-alpha.5...v0.47.0-alpha.6) (2024-10-08)

### Features

- Update borrow incentive pools ([525f90c](https://github.com/scallop-io/sui-scallop-sdk/commit/525f90c2ae6ab632cb66cc71cdc2d1b46af93d9e))

### [0.47.0-alpha.5](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.0-alpha.4...v0.47.0-alpha.5) (2024-10-08)

### Features

- Refactor fallback values ([06f0a47](https://github.com/scallop-io/sui-scallop-sdk/commit/06f0a47e4be7ca19b060c27882bd8cab390fc174))

### [0.47.0-alpha.4](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.0-alpha.3...v0.47.0-alpha.4) (2024-10-07)

### Features

- Pull updates from `v0.46.65`

### [0.47.0-alpha.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.0-alpha.2...v0.47.0-alpha.3) (2024-10-07)

### Features

- Add usdc native name, symbol, and type support ([b276009](https://github.com/scallop-io/sui-scallop-sdk/pull/172/commits/b276009e2fb00453c3d4f36acd17a49334a80d5b))

### [0.46.65](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.64...v0.46.65) (2024-10-07)

### Features

- Optimize query ([f0fb4cc](https://github.com/scallop-io/sui-scallop-sdk/commit/f0fb4cc64e1b891b79baf6625b3cf5a8cd034e1e))

### [0.46.64](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.63...v0.46.64) (2024-10-06)

### Features

- Upgrade packages ([9b25eca](https://github.com/scallop-io/sui-scallop-sdk/commit/9b25eca01909e099f1d35990f31c206d1b9e72aa))

### [0.47.0-alpha.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.47.0-alpha.1...v0.47.0-alpha.2) (2024-10-04)

### Features

- Use `migrate` API ([d5da789](https://github.com/scallop-io/sui-scallop-sdk/pull/171/commits/d5da789ba59a1d148273eaacb617bc45a9a0a5a3))

### [0.46.63](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.62...v0.46.63) (2024-10-03)

### Features

- Fix minor ([5886ea2](https://github.com/scallop-io/sui-scallop-sdk/commit/5886ea23cc3e2d91b0ee12bc45845729b2a68a35))

### [0.47.0-alpha.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.62...v0.47.0-alpha.1) (2024-09-30)

### ⚠ BREAKING CHANGES

- Refactor the entire naming for wormhole wrapped coin. For example:
  - sol -> wsol; ssol -> swsol
  - apt -> wapt; sapt -> swapt
  - btc -> wbtc; sbtc -> swbtc
  - eth -> weth; seth -> sweth
  - usdc -> wusdc; susdc -> swusdc
  - usdt -> wusdt; susdt -> swusdt

### [0.46.62](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.61...v0.46.62) (2024-09-27)

### Features

- Fix typo ([4e9efd5](https://github.com/scallop-io/sui-scallop-sdk/pull/167/commits/4e9efd50e7a1178ae84cd6346fa633ebc413ce93))

- Change `supplyLimit` to `maxSupplyCoin` ([a074b56](https://github.com/scallop-io/sui-scallop-sdk/pull/167/commits/a074b56e436d1b0b55b31b244c3968f18628e80c))

### [0.46.61](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.60...v0.46.61) (2024-09-26)

### Features

- Add `getVeSca` query ([9280e3d](https://github.com/scallop-io/sui-scallop-sdk/pull/165/commits/9280e3d902c81a08bbace89d2edc3c055520c766))

- Add supply limit information ([8e52981](https://github.com/scallop-io/sui-scallop-sdk/pull/165/commits/8e5298133e828bd34a05853855a238d9a228b71e))

### [0.46.60](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.59...v0.46.60) (2024-09-24)

### Features

- Bump version

### [0.46.59](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.58...v0.46.59) (2024-09-24)

### Bugfix

- Fix error `redeem market coin too small` ([36f905c](https://github.com/scallop-io/sui-scallop-sdk/pull/163/commits/36f905c9213280df1e9582f8e77c21b94670293e))

### [0.46.58](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.58-alpha.1...v0.46.58) (2024-09-24)

### Features

- Allow excluding staked coin in `migrateAllMarketCoin` method ([4e1725e](https://github.com/scallop-io/sui-scallop-sdk/pull/162/commits/4e1725e17069a235957561a1a6bf899a4569d074))

### [0.46.58-alpha.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.57...v0.46.58-alpha.1) (2024-09-19)

### Adjustments

- Increase `staleTime` to 2s ([608489c](https://github.com/scallop-io/sui-scallop-sdk/pull/161/commits/608489c60304e5c79b2377aebf8680ebfbbf91b1))
- Limit 10 for owned objects query ([6d96fd6](https://github.com/scallop-io/sui-scallop-sdk/pull/161/commits/6d96fd6301e70448055526e98cd03e722bb4f005))
- Increase token per interval to `50` and apply incremental delay time ([d04e04d](https://github.com/scallop-io/sui-scallop-sdk/pull/161/commits/d04e04dda690b21f01d63910a4cd6dda3c61a9fe))
- Add `walletAddress` params to `ScallopCache` ([4e7f940](https://github.com/scallop-io/sui-scallop-sdk/pull/161/commits/4e7f94046cbfcfdc6b67921aeaeff94b5d457669))

### [0.46.57](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.56...v0.46.57) (2024-09-13)

### Bugfixes

- Reduce query object limit from 50 to 10 ([877667d](https://github.com/scallop-io/sui-scallop-sdk/pull/160/commits/877667d747ef8b397c910d421e71d11ed7ff7f60))
- Fix undefined value ([9e4e653](https://github.com/scallop-io/sui-scallop-sdk/pull/160/commits/9e4e653762857a901dd82de5bafbbd09b17fa1e8))
- Fix selecting SUI coin type ([38b2885](https://github.com/scallop-io/sui-scallop-sdk/pull/160/commits/38b2885110c3038435615e98b824512415d33640))

### [0.46.56](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.55...v0.46.56) (2024-09-11)

### Features

- Add sCoin support for BTC and SOL ([b191459](https://github.com/scallop-io/sui-scallop-sdk/pull/159/commits/b1914597985f4c7d0bc5c3aca34dfc25fbc90738))

- Add `getSCoinSwapRate` method into `scallopQuery` ([f7e1ac0](https://github.com/scallop-io/sui-scallop-sdk/pull/159/commits/f7e1ac0f7b277e600065f98b2353c5e86e9f6079))

- Add `sCoinType` property to `marketPool` return type ([9a2bd5c](https://github.com/scallop-io/sui-scallop-sdk/pull/159/commits/9a2bd5cb87dac13e75fd4a8a0925b0a962e5ef75))

- Add `claimAllUnlockedSca` method into `scallopClient` ([d4dbdc8](https://github.com/scallop-io/sui-scallop-sdk/pull/159/commits/d4dbdc86f4554f141c4c6ee13176ba67fddaf139))

### [0.46.55](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.53...v0.46.54) (2024-08-18)

### Bugfixes

- Fix the issue where the loyalty program is not transferring rewards to the user’s address after claiming ([82a411d](https://github.com/scallop-io/sui-scallop-sdk/pull/154/commits/82a411d0c19998dc0ddf398edbac7c57c1b2bea7))

### [0.46.54](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.53...v0.46.54) (2024-08-06)

### Features

- Add token bucket algorithm for rate limit rpc requests ([d4369ef](https://github.com/scallop-io/sui-scallop-sdk/pull/151/commits/d4369efefc8eb0eb47604706dcf8f2e21651e1e5))

- Remove logic from `unstakeQuick` to prevent ambiguity of the method responsibility ([5633a35](https://github.com/scallop-io/sui-scallop-sdk/pull/151/commits/5633a352f9a200e43d2f08006d5540e4fcefced8))

### [0.46.53](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.52...v0.46.53) (2024-08-01)

### Bugfixes

- `stakeHelper` function, handle stake spool when user has old marketCoin and new sCoin ([5911caf](https://github.com/scallop-io/sui-scallop-sdk/pull/150/commits/5911caf00373e085a7dead3d1f557f8ec4390bf9))

- minor fix on `migrateAllMarketCoin` ([49da8b8](https://github.com/scallop-io/sui-scallop-sdk/pull/150/commits/49da8b860d5f12d32ff2cf03cec14082206f04b8)) ([04e777f](https://github.com/scallop-io/sui-scallop-sdk/pull/150/commits/04e777f492355d76002ffa66f3a4c6c5da340037))

### [0.46.52](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.51...v0.46.52) (2024-07-31)

### Bugfixes

- Different staleTime value in `queryGetAllCoinBalances` ([b84fdc8])(https://github.com/scallop-io/sui-scallop-sdk/pull/149/commits/b84fdc817104eec1b762536c879b72f2e786ef02)

### [0.46.51](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.50...v0.46.51) (2024-07-31)

### Features

- Reduce the cache time ([41cf8e0](https://github.com/scallop-io/sui-scallop-sdk/pull/148/commits/41cf8e0bb8f837922b123321527a676020379abb))

### [0.46.50](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.49...v0.46.50) (2024-07-30)

### Bugfixes

- Fix reward apr for borrow incentive when point is 0 ([64c924f](https://github.com/scallop-io/sui-scallop-sdk/pull/146/commits/64c924fa38f603efc15739436e52d0e700fa1c32))

### Features

- Add `walletAddress` property to `ScallopQuery` instance ([94d8396](https://github.com/scallop-io/sui-scallop-sdk/pull/146/commits/94d839684f865d5dfc3fd7dac9abfde634825d1b))
- Optimize `getPythPrices` function ([d75234b](https://github.com/scallop-io/sui-scallop-sdk/pull/146/commits/d75234b190afdd89c9d749d861d2fdf3aad9a38f))

### [0.46.49](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.48...v0.46.49) (2024-07-12)

### Bugfixes

- Minor fix ([74fa9f5](https://github.com/scallop-io/sui-scallop-sdk/pull/144/commits/74fa9f5ffe184c01be3b2c87203a411f27c9f73e))
- Fix `getPythPrices` function ([768a865](https://github.com/scallop-io/sui-scallop-sdk/pull/144/commits/768a865ecd41c81884ddc57b3b0ec7c3456cbfd3))

### [0.46.48](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.47...v0.46.48) (2024-07-09)

### Features

- Add `returnSCoin` parameter to `unstakeQuick` ([a3ad485](https://github.com/scallop-io/sui-scallop-sdk/pull/143/commits/a3ad48598040f33572521b62a976f4ad01246f2e))

### [0.46.47](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.46...v0.46.47) (2024-07-09)

### Bugfixes

- update `unstakeQuick` return type ([8fe0660](https://github.com/scallop-io/sui-scallop-sdk/commit/8fe06602c8a63e66c90a198bb3ebf6b0e319c187))

### [0.46.46](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.45...v0.46.46) (2024-07-09)

### Bugfixes

- Adjust unit tests that uses `unstakeQuick` ([fcace2b](https://github.com/scallop-io/sui-scallop-sdk/pull/140/commits/fcace2b67afcd1268a0a113573e0adc35a5d23d0))

### [0.46.45](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.44...v0.46.45) (2024-07-09)

### Bugfixes

- Minor bugfix ([43206bb](https://github.com/scallop-io/sui-scallop-sdk/commit/43206bb628be08677bbdd38645b17ec87febb4dc))

### [0.46.44](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.43...v0.46.44) (2024-07-09)

### Features

- Adjust staking spool methods with new sCoin ([607f53f](https://github.com/scallop-io/sui-scallop-sdk/pull/137/commits/607f53ff4997e4f010a274e6f5d0cb62fba06b27))

### [0.46.43](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.42...v0.46.43) (2024-07-09)

### Bugfixes

- Minor fix on `unstakedMarketAmount` ([faa647d](https://github.com/scallop-io/sui-scallop-sdk/pull/136/commits/faa647d7eac2518a71fb12eb4060bdf42c9d2ceb))

### [0.46.42](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.41...v0.46.42) (2024-07-08)

### Bugfixes

- Fix `getLending` parameters order ([f71217b](https://github.com/scallop-io/sui-scallop-sdk/pull/135/commits/f71217b77199fc13187183fb21a8afa231226a2d))

### [0.46.41](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.40...v0.46.41) (2024-07-05)

### Features

- Add query, builder, and client method for new sCoin ([291eca0](https://github.com/scallop-io/sui-scallop-sdk/pull/133/commits/291eca006ab840e9cbc8ae2a9e2c704c7d583fc1#diff-e57c6bce272cb177bd51299d195f4345717e217061346ed71b690943bd189758))
- Update docs ([61a53b3](https://github.com/scallop-io/sui-scallop-sdk/pull/133/commits/61a53b3f78a15d70469624729c5300b95402e839))
- Update `API_BASE_URL` ([50ec3a8](https://github.com/scallop-io/sui-scallop-sdk/pull/133/commits/50ec3a8fd2e4adbe6c9655e8ea80435247081062))
- Add `totalRewardedPools` ([d38f654](https://github.com/scallop-io/sui-scallop-sdk/pull/132/commits/d38f65467bce51eb3b2937c59d446f7d29b054c4))

### [0.46.40](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.39...v0.46.40) (2024-07-02)

### Features

- Add `getFlashLoanFees` function in `scallopQuery` ([1a5ee01](https://github.com/scallop-io/sui-scallop-sdk/pull/129/commits/1a5ee01ee777ae8aad35c47b9fa03dace94864f4))

### [0.46.39](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.38...v0.46.39) (2024-06-20)

### Bug Fixes

- Fix await `Promise` ([42e9c44](https://github.com/scallop-io/sui-scallop-sdk/pull/125/commits/42e9c44feff91823b784c706702212b5192d41e6))

### [0.46.38](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.37...v0.46.38) (2024-06-17)

### Bug Fixes

- Fix order of execution ([5cfdc24](https://github.com/scallop-io/sui-scallop-sdk/pull/124/commits/5cfdc2416b295c68d13ba0456c0ce7b39164e1f3))
- Use concurrency on `getStakeRewardPools` ([c59cfdb](https://github.com/scallop-io/sui-scallop-sdk/pull/124/commits/c59cfdb02a1b89085873aaa476a673e984a8b4b3))

### [0.46.37](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.36...v0.46.37) (2024-06-10)

### Features

- Scallop Loyalty Program ([13c660d](https://github.com/scallop-io/sui-scallop-sdk/pull/120/commits/13c660d8a3c4b48a24caecdec008231d29497174))
- Refactor vesca builder, query, and docs ([f5e1765](https://github.com/scallop-io/sui-scallop-sdk/pull/120/commits/f5e17654481098ec1e6dafb3c3c0173368b4e4e3)) ([cb9d27d](https://github.com/scallop-io/sui-scallop-sdk/pull/120/commits/cb9d27d928b33851ea0c8f0ee47104efabe6b330))

### [0.46.36](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.35...v0.46.36) (2024-06-01)

### Bug Fixes

- Minor fix ([305a8ff](https://github.com/scallop-io/sui-scallop-sdk/pull/117/commits/305a8ffab0c8869b2756b42d75ee60d583c05139))

### [0.46.35](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.34...v0.46.35) (2024-06-01)

### Bug Fixes

- Minor fix ([882853f](https://github.com/scallop-io/sui-scallop-sdk/pull/115/commits/882853fd2e3b436795562a2c784cedd2bf770e82))

### [0.46.34](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.33...v0.46.34) (2024-05-31)

### Bug Fixes

- Minor refactor ([2396869](https://github.com/scallop-io/sui-scallop-sdk/pull/110/commits/2396869ef341ea919fdf8b1b98ffb8a72512ae59))
- Fix debt calculation ([7878074](https://github.com/scallop-io/sui-scallop-sdk/pull/110/commits/7878074861b4b379a5cbad7f1e6c780bc9d5ae51))

### [0.46.33](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.32...v0.46.33) (2024-05-29)

### Bug Fixes

- Fix `increasedPointRate` calculation ([18d364a](https://github.com/scallop-io/sui-scallop-sdk/pull/108/commits/18d364a6730c5580112a042646bac65abbc24a07))

### [0.46.32](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.31...v0.46.32) (2024-05-27)

### Bug Fixes

- Fix typo ([35b2055](https://github.com/scallop-io/sui-scallop-sdk/pull/106/commits/35b2055ad4417e5a94d97b460b3ae43224101eb7))

### ⚠ BREAKING CHANGES

- Refactor borrow incentive pools structure ([516afb5](https://github.com/scallop-io/sui-scallop-sdk/pull/106/commits/516afb508891b75e8fc134abfb678a821126ed6f))

### [0.46.31](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.3...v0.46.31) (2024-05-27)

### Bug Fixes

- Update lockfile ([1b71119](https://github.com/scallop-io/sui-scallop-sdk/pull/105/commits/1b711192e96df5df84fffa03068fae8ef9f2437c))

### Features

- Enable indexer for borrowIncentivePools([737c122](https://github.com/scallop-io/sui-scallop-sdk/commit/737c1228572775dbf63e282407f141416ec0c6d2))

### [0.46.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.2...v0.46.3) (2024-05-27)

### Bug Fixes

- Sort veSCA by balance([b78c7e3](https://github.com/scallop-io/sui-scallop-sdk/pull/102/commits/b78c7e3916552360cefbe4340ec19e06b8dd4e26))

### [0.46.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.1...v0.46.2) (2024-05-23)

### Bug Fixes

- Minor bug fix on spool

### [0.46.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.46.0...v0.46.1) (2024-05-22)

### Bug Fixes

- Minor bug fix

### [0.46.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.45.0...v0.46.0) (2024-05-22)

### Features

- Add Referral Program

### [0.45.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.28...v0.45.0) (2024-05-12)

### Bug Fixes

- Avoid multiple RPC calls and Move Call on the same object of short period of time

### [0.44.28](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.27...v0.44.28) (2024-05-11)

### Features

- Export `getBindedObligationId` and `getBindedVeScaKey` functions ([e0a4365](https://github.com/scallop-io/sui-scallop-sdk/commit/e0a436536ea94a03b1937284d49b10a53c3b1f10))
- `getVeSca` return veSca with highest balance ([95d928f](https://github.com/scallop-io/sui-scallop-sdk/commit/95d928f704808f695e476a91623deeec2eb1256b))

### [0.44.27](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.26...v0.44.27) (2024-04-26)

### Features

- Minor bugfixes ([c03c516](https://github.com/scallop-io/sui-scallop-sdk/commit/c03c516d7f09296cb3124518ced35666f4ecf676))

### [0.44.26](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.25...v0.44.26) (2024-04-26)

### Features

- Add `deactiveBoost` method to borrowIncentive builder module([f469475](https://github.com/scallop-io/sui-scallop-sdk/commit/f469475f548448723232304a63116c3e2fb0fe36))

### [0.44.25](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.24...v0.44.25) (2024-04-22)

### Features

- add afsui, hasui, vsui, and eth borrow incentive([0190c69](https://github.com/scallop-io/sui-scallop-sdk/commit/0190c69520318d76012ef201593cad915f069757))

### [0.44.24](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.23...v0.44.24) (2024-04-22)

### Features

- add sca borrow incentive ([8504da3](https://github.com/scallop-io/sui-scallop-sdk/commit/8504da3d303f543d214763dec8cbdc88038280d1))

### [0.44.23](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.22...v0.44.23) (2024-04-21)

### Features

- add new sca pool ([ffb8788](https://github.com/scallop-io/sui-scallop-sdk/commit/ffb8788e90247b177f0bcd84110ed6f213ece5ed))

### [0.44.22](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.21...v0.44.22) (2024-04-01)

### Bug Fixes

- Minor fix on borrow incentive `objectId` ([184b03d](https://github.com/scallop-io/sui-scallop-sdk/pull/76/commits/184b03da0d3f67124335af4d796d3c4802cd239a))

### [0.44.21](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.20...v0.44.21) (2024-03-29)

### Bug Fixes

- Minor fix on borrow incentive builder test ([39af1fa](https://github.com/scallop-io/sui-scallop-sdk/pull/74/commits/39af1fae44eecf1c259ef7942ac5dc05c977571c))
- add `isFinite` check to `boostValue` calculation, add `staked` property to `BorrowIncentivePool` type ([97640b5](https://github.com/scallop-io/sui-scallop-sdk/commit/97640b5cfb59f9e615413bc1e755da50c85b4154))

### Features

- Refactor unit tests for veSCA builder ([3d0acf4](https://github.com/scallop-io/sui-scallop-sdk/pull/74/commits/3d0acf48736a9336f2cdc2cb98df8bdf1a9981e2))

### [0.44.20](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.19...v0.44.20) (2024-03-26)

### Bug Fixes

- borrow incentive reward apr calculation ([555671f](https://github.com/scallop-io/sui-scallop-sdk/commit/555671f944187fc2d8b0cac73e3fb595e53b1632))
- get sca price in with pyth feed ([2347b87](https://github.com/scallop-io/sui-scallop-sdk/commit/2347b879156969cbc62a0be29134bdb97f24460d))

### [0.44.19](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.18...v0.44.19) (2024-03-25)

### Features

- add veSCA and stakeObligationWithVeSca implementation ([dbd6c68](https://github.com/scallop-io/sui-scallop-sdk/commit/dbd6c6869228834f1df12a779356086892c52632))
- add vesca bind check before using it ([873826b](https://github.com/scallop-io/sui-scallop-sdk/commit/873826bb511708cbcb756407cfae91c4a1dea71c))
- done veScaQuickMethods ([d96fe36](https://github.com/scallop-io/sui-scallop-sdk/commit/d96fe366d99d2c8e970a1d87b530e0707aff8e01))
- finish borrow incentive ([bd466fb](https://github.com/scallop-io/sui-scallop-sdk/commit/bd466fbf8312c791cd6eec1b4ce5e1f3faef5918))
- update address id ([0f9d6a9](https://github.com/scallop-io/sui-scallop-sdk/commit/0f9d6a9f600c9a3b70e84a4431de09f587b3177c))
- use test vesca ([d700b3c](https://github.com/scallop-io/sui-scallop-sdk/commit/d700b3c92411afbf5084d9d2ac3ffebe489910de))

### Bug Fixes

- Add OLD_BORROW_INCENTIVE_PROTOCOL_ID constant to borrowIncentiveBuilder.ts ([01c0d0a](https://github.com/scallop-io/sui-scallop-sdk/commit/01c0d0aea86e86b3a18de690dc10db15e051c934))
- add weighted staked on query ([6e79d08](https://github.com/scallop-io/sui-scallop-sdk/commit/6e79d08d9236a1cb5b167fbb864463eb54f6cc50))
- boost calculation ([270ed16](https://github.com/scallop-io/sui-scallop-sdk/commit/270ed169f758c2416022502c7856f72c1d92c61b))
- minor ([df4d118](https://github.com/scallop-io/sui-scallop-sdk/commit/df4d118a68bfe3a7e9eebce222641ad24851562f))
- minor typo ([c1ba7ff](https://github.com/scallop-io/sui-scallop-sdk/commit/c1ba7ff26bf64581d687db40bb601c9bd7857449))
- typo ([fb57c5a](https://github.com/scallop-io/sui-scallop-sdk/commit/fb57c5a992a3dd791b646d2735331c4175a92526))
- use normal stake if no vesca ([4dda1df](https://github.com/scallop-io/sui-scallop-sdk/commit/4dda1df272d43c5c6c745520db439a968ca3f5b0))
- use production addressses ([3f14e82](https://github.com/scallop-io/sui-scallop-sdk/commit/3f14e8258c3a1c1d52cc2e054838c53fdd1c786e))

### [0.44.18](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.17...v0.44.18) (2024-03-03)

### Bug Fixes

- reward apr rate ([37beb89](https://github.com/scallop-io/sui-scallop-sdk/commit/37beb892b278519f5e466c9935cef2f9d1b5bfe4))

### [0.44.17](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.16...v0.44.17) (2024-03-03)

### Features

- add multiple pyth endpoints ([216b6a3](https://github.com/scallop-io/sui-scallop-sdk/commit/216b6a3de1b5f8a9c4018ff10c138f6132cd3bb6))
- add new spools ([fc08c12](https://github.com/scallop-io/sui-scallop-sdk/commit/fc08c12e559690c7e57ae4ae24ad9ab150e2e239))
- support specifying pyth endpoints ([a526c36](https://github.com/scallop-io/sui-scallop-sdk/commit/a526c361f532f3011f124196d39191bd834e0f07))

### Bug Fixes

- redundant initialization ([bd74a99](https://github.com/scallop-io/sui-scallop-sdk/commit/bd74a99568c6a2044a8c493517b163447bc354f3))

### [0.44.16](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.15...v0.44.16) (2024-01-29)

### Features

- remove reward fee ([78e62d8](https://github.com/scallop-io/sui-scallop-sdk/commit/78e62d8fe2ea2857f8ea491bd7e47053f046b927))

### [0.44.15](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.14...v0.44.15) (2024-01-29)

### Features

- add LSDs to the const of empty addresses ([eebc5ed](https://github.com/scallop-io/sui-scallop-sdk/commit/eebc5ed9d61e93ecb374f39f934e0728bd62718f))
- add support for new spools in `getStakeAccounts` ([aad24e0](https://github.com/scallop-io/sui-scallop-sdk/commit/aad24e08234ad1c8ede2a67bbafbb110622a6f22))
- lending query adds `conversionRate` and `marketCoinPrice` fields ([ebe4e33](https://github.com/scallop-io/sui-scallop-sdk/commit/ebe4e3391820cda8de30bd94d4ce07e0a8a1e067))
- update for lsd incentive ([e37ccdb](https://github.com/scallop-io/sui-scallop-sdk/commit/e37ccdb3a85bbb0994c427a65dbaf50e7d4a2483))

### [0.44.14](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.13...v0.44.14) (2024-01-11)

### Bug Fixes

- remove coin name for `stakeObligation` and `unstakeObligation` ([186cf2e](https://github.com/scallop-io/sui-scallop-sdk/commit/186cf2efe9cec3d4732fcd7ccb4e10a1888a3629))

### [0.44.13](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.12...v0.44.13) (2024-01-07)

### Bug Fixes

- wrong variable ([46d35cb](https://github.com/scallop-io/sui-scallop-sdk/commit/46d35cb799018a00eae462a515f4cc4e42957ea7))

### [0.44.12](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.11...v0.44.12) (2024-01-05)

### Bug Fixes

- wrong obligation id obtaining ([2e4e6e9](https://github.com/scallop-io/sui-scallop-sdk/commit/2e4e6e9974c6c413b0485e1a0d60d88dfd0ddd3f))

### [0.44.11](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.10...v0.44.11) (2024-01-05)

### Bug Fixes

- avoid loop getOwnedObjects ([327e82b](https://github.com/scallop-io/sui-scallop-sdk/commit/327e82b4dff5f1294271c5c55e8e40ead5ed2d0d))

### [0.44.10](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.9...v0.44.10) (2023-12-27)

### Features

- add change ratio when using indexer for getTvl ([e4e9ce6](https://github.com/scallop-io/sui-scallop-sdk/commit/e4e9ce6e9011768e4238318b6ddb4acb78be0776))

### [0.44.9](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.8...v0.44.9) (2023-12-27)

### Features

- add poolSize limit to `availableDepositAmount` ([e42be8a](https://github.com/scallop-io/sui-scallop-sdk/commit/e42be8abc00959bfcfb506bcd94d3b6f903d0cb9))
- update sdk api endpoint ([78ea1d4](https://github.com/scallop-io/sui-scallop-sdk/commit/78ea1d44e07290b6bb3987f2e65e82f0622d481f))

### [0.44.8](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.7...v0.44.8) (2023-12-26)

### Features

- add scallop indexer ([cece9be](https://github.com/scallop-io/sui-scallop-sdk/commit/cece9be4c7347fd5ab623412c416b310cfdc315c))

### [0.44.7](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.6...v0.44.7) (2023-11-30)

### Features

- add `requiredRepay` field and change the value of `availableRepay` in `obligationAccount` ([4118a29](https://github.com/scallop-io/sui-scallop-sdk/commit/4118a29dbbe0be422a1d79b4d6837c6602a62545))
- add usdt borrow incentive support ([d89d558](https://github.com/scallop-io/sui-scallop-sdk/commit/d89d55851e8de53c4a3d528425ee344d1717aa0d))
- borrow and repay with sign tx in client support incentive ([ddf8298](https://github.com/scallop-io/sui-scallop-sdk/commit/ddf82981bfc6fd0bc0f0228d43c4ae4180839a0f))

### [0.44.6](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.5...v0.44.6) (2023-11-28)

### [0.44.5](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.4...v0.44.5) (2023-11-24)

### Features

- add an object id address to dynamically update protocol objec ([df8faa3](https://github.com/scallop-io/sui-scallop-sdk/commit/df8faa3b55f7cb558770081b0180407387672649))
- add borrow fee information in core query ([2a4dfa8](https://github.com/scallop-io/sui-scallop-sdk/commit/2a4dfa8170d2f772747068e17d5607fe9349afe8))
- add reward fee information in spool and borrow incentive query ([0b26403](https://github.com/scallop-io/sui-scallop-sdk/commit/0b264031646ba598bfc4888db5b8e357bacf4b59))

### [0.44.4](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.3...v0.44.4) (2023-11-14)

### Features

- add avaliable claim of borrow incentive pools in getObligationAccount ([fcaac4c](https://github.com/scallop-io/sui-scallop-sdk/commit/fcaac4cc8e85539f6af8f06e21dcd085ff359a1b))

### Bug Fixes

- wrong `availableClaim` in getLending ([fee4ec6](https://github.com/scallop-io/sui-scallop-sdk/commit/fee4ec6b7024681538677d8d9ca05bbb0d185dbd))

### [0.44.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.2...v0.44.3) (2023-11-12)

### Features

- add borrow incentive support ([d6ad251](https://github.com/scallop-io/sui-scallop-sdk/commit/d6ad2519a942cd847c7e0c9aa4ac253cb51e6271))
- rename functions and constants for spool ([8d49c06](https://github.com/scallop-io/sui-scallop-sdk/commit/8d49c0607b9030c8d556cbe7a7003d41f9be5dc2))

### [0.44.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.1...v0.44.2) (2023-11-07)

### Features

- add new vsui pool ([63ffffb](https://github.com/scallop-io/sui-scallop-sdk/commit/63ffffb887b022c1a3d3687e7893a2ace38fe4b4))

### [0.44.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.44.0...v0.44.1) (2023-10-25)

### Features

- add new afsui and hasui pools ([c42ec5b](https://github.com/scallop-io/sui-scallop-sdk/commit/c42ec5b442beea4453bfeed37bd93f03c12d4766))

## [0.44.0](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.42.8...v0.44.0) (2023-10-22)

### [0.42.8](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.42.7...v0.42.8) (2023-10-20)

### [0.42.7](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.42.6...v0.42.7) (2023-10-18)

### Bug Fixes

- modify symbol type ([9811930](https://github.com/scallop-io/sui-scallop-sdk/commit/9811930767d306d8f673eb7b3ca475c1b7b3d67a))

### [0.42.6](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.42.5...v0.42.6) (2023-10-10)

### Bug Fixes

- correct the number of staked coin for `getLending` ([466d603](https://github.com/scallop-io/sui-scallop-sdk/commit/466d6037ae9015df914d4fbb8bb145c064c46515))

### [0.42.5](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.42.4...v0.42.5) (2023-10-07)

### [0.42.4](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.42.3...v0.42.4) (2023-10-07)

### [0.42.3](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.42.2...v0.42.3) (2023-10-07)

### Features

- add getting tvl in query model ([33579ca](https://github.com/scallop-io/sui-scallop-sdk/commit/33579cac9460eb4322a80e8f0e66243bbe42a93a))

### [0.42.2](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.42.1...v0.42.2) (2023-10-05)

### Features

- add depositAndStake and unstakeAndWithdraw ([57e8669](https://github.com/scallop-io/sui-scallop-sdk/commit/57e8669238785cdf2910ef4e39a3196dd5b6b6bd))
- add get coins amount ([8311bf2](https://github.com/scallop-io/sui-scallop-sdk/commit/8311bf2a196139fe0d3ddb93f4e86c4640d132db))
- add get market coin ([6bd48ae](https://github.com/scallop-io/sui-scallop-sdk/commit/6bd48ae8e69b60f02236fd9a232a09d7bc5be6fe))
- add get market coins ([18e136c](https://github.com/scallop-io/sui-scallop-sdk/commit/18e136c8e58258c07af97d41ff06b08293f6ac9d))
- add getting coin decimal to utils ([02efc60](https://github.com/scallop-io/sui-scallop-sdk/commit/02efc605695c9233e3cb5146f2a921300fc25314))
- add getting coin wrap type to utils ([93b7b14](https://github.com/scallop-io/sui-scallop-sdk/commit/93b7b146df10137091870f4ffbd6d22853940376))
- add getting multiple stake and reward pools in query ([6be7063](https://github.com/scallop-io/sui-scallop-sdk/commit/6be70637e53d9d0a62c5064ef96a4c4a9707fd19))
- add getting obligation account in query ([31bad4e](https://github.com/scallop-io/sui-scallop-sdk/commit/31bad4e87e3672da6ea626ca045f3c9a49c9fc68))
- add getting price from pyth to query and utils ([ee487a0](https://github.com/scallop-io/sui-scallop-sdk/commit/ee487a01a0bf4e0aa29c73a0fbb30a6f272877c3))
- add getting spools and spool in query ([ba92d7b](https://github.com/scallop-io/sui-scallop-sdk/commit/ba92d7bf1c1290d8da554ad2b47b1c11b84ee846))
- add getting user lending info in query ([21fdf6a](https://github.com/scallop-io/sui-scallop-sdk/commit/21fdf6acf37989b2f382f239b1ae3c0db9a6dd28))
- add market pools and collaterals ([fc72248](https://github.com/scallop-io/sui-scallop-sdk/commit/fc722483021c1422bf01d9a70bf94d37be18ef5d))
- add marketPool fields ([7901444](https://github.com/scallop-io/sui-scallop-sdk/commit/7901444137adbae40f4ce7c906fc0f1156309073))
- add parse coin name to symbol function in utils ([85c96bd](https://github.com/scallop-io/sui-scallop-sdk/commit/85c96bda15ac77d305fdd9611b3cd047b3fa873d))
- add portfolio query and improve pool, collateral and spool fields ([c75e462](https://github.com/scallop-io/sui-scallop-sdk/commit/c75e46204f618ed9a54760d7281414fcb4f7c979))
- add price field into marke pools and collaterals ([99b3958](https://github.com/scallop-io/sui-scallop-sdk/commit/99b3958a130033c0a81efcb204cc87bd7884d4df))

### Bug Fixes

- correct getting coin prices ([38bd69c](https://github.com/scallop-io/sui-scallop-sdk/commit/38bd69c7a8d3c770ffa5a5991246d7e2fb218bb5))
- correct getting coin type regex ([3badcfc](https://github.com/scallop-io/sui-scallop-sdk/commit/3badcfc7bd3a7111f21fba8f46eed10390b22510))

## [0.42.1](https://github.com/scallop-io/sui-scallop-sdk/compare/v0.37.12...v0.42.1) (2023-09-27)

### ⚠ BREAKING CHANGES

- refactor the entire SDK

### Features

- add new usdt spool ([1fe9c67](https://github.com/scallop-io/sui-scallop-sdk/commit/1fe9c67f588d9601fadc39ab5131f8bc40341a80))

- improve all scallop class ([5a4df11](https://github.com/scallop-io/sui-scallop-sdk/commit/5a4df11464f80f902f445768c296a5b0f309ddfb))
