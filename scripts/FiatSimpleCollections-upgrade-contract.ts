/* eslint-disable @typescript-eslint/naming-convention */
import { ethers, upgrades } from 'hardhat'
import type { FiatSimpleCollections__factory } from '../typechain-types'

const DEPLOYED_ADDRESS = ''

async function main() {
	const contract = (await ethers.getContractFactory(
		'FiatSimpleCollections'
	)) as FiatSimpleCollections__factory
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
