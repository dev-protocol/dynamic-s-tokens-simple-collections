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

# Set images

## Edit scripts/set-image.ts

```ts
const DEPLOYED_ADDRESS = '<DEPLOYED_SIMPLECOLLECTIONS>'
const PROPERTY_ADDRESS = '<PROPERTY_ADDRESS>'
const IMAGES: SimpleCollections.ImageStruct[] = [
	{
		src: 'ipfs://bafy...',
		requiredETHAmount: utils.parseEther('0.3'),
		requiredETHFee: utils.parseEther('0.03'),
	},
	{
		src: 'ipfs://bafy...',
		requiredETHAmount: utils.parseEther('0.3'),
		requiredETHFee: utils.parseEther('0.03'),
	},
]
const KEYS: Uint8Array[] = [
	utils.toUtf8Bytes('The First Art'),
	utils.toUtf8Bytes('The Second Art'),
]
```

## Run the script

```bash
yarn hardhat run --network <NETWORK_NAME> scripts/set-images.ts
```
