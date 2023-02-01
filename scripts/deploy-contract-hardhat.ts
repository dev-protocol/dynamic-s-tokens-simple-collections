/* eslint-disable @typescript-eslint/naming-convention */
import { ethers, upgrades } from 'hardhat'
import type { SimpleCollections__factory } from '../typechain-types'

const SWAP_And_STAKE_ADDRESS = ''

async function main() {
	const contract = (await ethers.getContractFactory(
		'SimpleCollections'
	)) as SimpleCollections__factory
	const impl = await upgrades.deployImplementation(contract)
	const admin = await upgrades.deployProxyAdmin()
	const deployedContract = await upgrades.deployProxy(
		contract,
		[SWAP_And_STAKE_ADDRESS],
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
