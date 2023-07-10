# Dynamic sTokens Simple Collections

## Deployed addresses

| Chain           | SimpleCollections<br/>(UpgradeableProxy)     | Admin                                        |
| --------------- | -------------------------------------------- | -------------------------------------------- |
| Polygon Mumbai  | `0x672bA772beD905Ad9Ecb924bD9c47eAb156153C0` | `0x1d556338cc64304b41BAbeC0aF833E3181338026` |
| Polygon Mainnet | `0xF235ff0A6B33e074daFd98bB4BD2b300c1561339` | `0xAFD8111ee1f9910ee42dfE7A8d129d8C7A8Ea466` |

For the JPY Fiat oracle, we are using https://polygonscan.com/address/0xd647a6fc9bc6402301583c91decc5989d8bc382d

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
		gateway: '<YOUR_ADDRESS>',
	},
	{
		src: 'ipfs://bafy...',
		requiredETHAmount: utils.parseEther('0.3'),
		requiredETHFee: utils.parseEther('0.03'),
		gateway: '<YOUR_ADDRESS>',
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
