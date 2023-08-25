/* eslint-disable @typescript-eslint/naming-convention */
import { ethers, upgrades } from 'hardhat'
import type { SimpleCollections__factory } from '../typechain-types'

const DEPLOYED_ADDRESS = '0x672bA772beD905Ad9Ecb924bD9c47eAb156153C0' // Polygon Mumbai
// const DEPLOYED_ADDRESS = '0xF235ff0A6B33e074daFd98bB4BD2b300c1561339' // Polygon

async function main() {
	const contract = (await ethers.getContractFactory(
		'SimpleCollections'
	)) as SimpleCollections__factory
	await upgrades
		.validateUpgrade(DEPLOYED_ADDRESS, contract)
		.then(() => {
			console.log('New implementation is valid')
		})
		.catch((error) => {
			console.error(error)
			process.exit(1)
		})

	await upgrades.upgradeProxy(DEPLOYED_ADDRESS, contract)

	console.log(
		'new implementation is:',
		await upgrades.erc1967.getImplementationAddress(DEPLOYED_ADDRESS)
	)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
