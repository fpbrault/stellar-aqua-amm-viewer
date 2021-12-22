# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.4](https://github.com/fpbrault/stellar-aqua-amm-viewer/compare/v0.2.3...v0.2.4) (2021-12-22)


### Features

* 🎸 adds input to set amount on all pairs ([0b738cd](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/0b738cd830930c07d1961577bab1c67d1f3ef230)), closes [#2](https://github.com/fpbrault/stellar-aqua-amm-viewer/issues/2)
* 🎸 Improve option section appearance ([77efcdb](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/77efcdb3294e2020a2ea1f3f1a29c099833c384a))
* 🎸 improves table appearance ([0b64400](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/0b644007e866301f7e4c74d1469d14682edcbdc3))


### Bug Fixes

* 🐛 fixes account data something missing ([28ea425](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/28ea4259cb28955988b2f66819bd0c20b861db3d))
* 🐛 fixes data not being up to date quickly enough ([42368cc](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/42368cce8dd2e6e8c28ef0c199b59754df23e109))
* 🐛 fixes table scroll on mobile ([5d4bf07](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/5d4bf071b25c067b99f6e758a21b5b00018ef668))

### [0.2.3](https://github.com/fpbrault/stellar-aqua-amm-viewer/compare/v0.2.2...v0.2.3) (2021-12-21)


### Bug Fixes

* 🐛 fixes rewards values not updating on toggle ([be0ca05](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/be0ca05b2c8100d25b38d7aa6593c88e122e2964))

### [0.2.2](https://github.com/fpbrault/stellar-aqua-amm-viewer/compare/v0.2.1...v0.2.2) (2021-12-21)


### Bug Fixes

* 🐛 fixes future rewards not accounting for 1% threshold ([3ab751d](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/3ab751da7ff76fcff5740c6eb5a31069bdf636fd))

### [0.2.1](https://github.com/fpbrault/stellar-aqua-amm-viewer/compare/v0.2.0...v0.2.1) (2021-12-21)


### Bug Fixes

* 🐛 adds types to rewards api to fix build ([eebfb80](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/eebfb807ced4be98e64912c1398a597c7994b9c5))

## [0.2.0](https://github.com/fpbrault/stellar-aqua-amm-viewer/compare/v0.1.2...v0.2.0) (2021-12-21)


### Features

* 🎸 adds future rewards ([aca8b2c](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/aca8b2c2dad437970c9fd31054258bda384424a5))
* 🎸 save public key to local storage ([4ebc176](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/4ebc176b82bce73ba7ad24eb0eca985c8deface4))
* 🎸 Use only one request to get reward data ([d34190a](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/d34190aa2fcead44dfc099081d95a011b939acdf))


### Bug Fixes

* 🐛 fixes account data not updating when pressing refresh ([624e2b2](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/624e2b26fa9dbb818292f51ecba629463ef57c77))

### [0.1.2](https://github.com/fpbrault/stellar-aqua-amm-viewer/compare/v0.1.1...v0.1.2) (2021-12-20)


### Bug Fixes

* 🐛 fixes aquaPrice build failure ([3a08ff6](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/3a08ff648db38f04c5b8154ea7db05f94770570c))

### [0.1.1](https://github.com/fpbrault/stellar-aqua-amm-viewer/compare/v0.1.0...v0.1.1) (2021-12-20)


### Features

* 🎸 adds balance retrieval from pubkey and albedo ([87a9f48](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/87a9f48eb1e6b56f686c7b0e4c8a8e8affe2a8e6))
* 🎸 adds changelog modal for new releases ([0afd536](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/0afd53623efe0e5abddb2d1d76ab2e170a66594f))

## 0.1.0 (2021-12-19)


### Features

* 🎸 added padding below table ([309378c](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/309378c4d3f6e1f0774adff87583f230619b6d3b))
* 🎸 adds placeholder animation ([7afede9](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/7afede946cf65da8d6d8c1f92feecf193c3765ad))
* 🎸 batch api calls ([6271c57](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/6271c577204b7c8ad77a8806495a64dc6e69d41d))
* 🎸 disables auto data revalidation on focus ([23a235e](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/23a235e7e700baa5b867446d77019899b9792e93)), closes [#6](https://github.com/fpbrault/stellar-aqua-amm-viewer/issues/6)
* 🎸 use GET call for pools to enable caching ([62d30b4](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/62d30b4174e869745af2544c3583fdf9904ede09))


### Bug Fixes

* 🐛 removed unused rewrite rule ([2c6295c](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/2c6295c8167a450134a225ecf0421f090a9ef53d))
* 🐛 updated repo url ([ab39999](https://github.com/fpbrault/stellar-aqua-amm-viewer/commit/ab39999fb58a73c908d8d6e98c2de3010807973c))
