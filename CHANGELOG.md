# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
