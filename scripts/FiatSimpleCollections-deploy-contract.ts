/* eslint-disable @typescript-eslint/naming-convention */
import { ethers, upgrades } from 'hardhat'
import type { FiatSimpleCollections__factory } from '../typechain-types'

const SWAP_And_STAKE_ADDRESS = ''
const UNISWAP_PAIR_ADDRESS = ''
const FIAT_ORACLE_ADDRESS = ''

async function main() {
	const contract = (await ethers.getContractFactory(
		'FiatSimpleCollections'
	)) as FiatSimpleCollections__factory
	const impl = await upgrades.deployImplementation(contract)
	const admin = await upgrades.deployProxyAdmin()
	const deployedContract = await upgrades.deployProxy(
		contract,
		[SWAP_And_STAKE_ADDRESS, UNISWAP_PAIR_ADDRESS, FIAT_ORACLE_ADDRESS],
		{ initializer: 'initialize' }
	)

	console.log('Implementation address:', impl)
	console.log('Admin address:', admin)
	console.log('UpgradeableProxy address:', deployedContract.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
