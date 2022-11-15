# Dynamic sTokens Simple Collections

## Deployed addresses

| Chain          | SimpleCollections<br/>(UpgradeableProxy)     | Admin                                        |
| -------------- | -------------------------------------------- | -------------------------------------------- |
| Polygon Mumbai | `0x954595040CCCb67278DbD11739e522a6870dc1eC` | `0xf48b103bd2E84117f2290ee0B3125865dbBcb96E` |

# Installation

```bash
yarn
```

# Verifying a deployed contracts

## For a contract with no constructor arguments

Run hardhat-etherscan

```bash
yarn hardhat verify --network <NETWORK_NAME> <CONTRACT_ADDRESS>
```

## For a contract with constructor arguments

1. Create an arguments declaration file

```js
// cat ./scripts/arguments.js
module.exports = [
	'arguments 1',
	'arguments 2',
	'arguments 3',
	...
]
```

2. Run hardhat-etherscan

```bash
yarn hardhat verify --network <NETWORK_NAME> <CONTRACT_ADDRESS> --contract <PATH_TO_CONTRACT>:<CONTRACT_NAME> --constructor-args ./scripts/arguments.js
```
