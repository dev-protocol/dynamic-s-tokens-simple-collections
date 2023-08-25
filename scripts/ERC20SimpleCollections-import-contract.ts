/* eslint-disable @typescript-eslint/naming-convention */
import { ethers, upgrades } from 'hardhat'
import type { ERC20SimpleCollections__factory } from '../typechain-types'

const DEPLOYED_ADDRESS = ''

async function main() {
	const contract = (await ethers.getContractFactory(
		'ERC20SimpleCollections'
	)) as ERC20SimpleCollections__factory
	await upgrades
		.forceImport(DEPLOYED_ADDRESS, contract)
		.then(() => {
			console.log('Proxy is imported')
		})
		.catch((error) => {
			console.error(error)
			process.exit(1)
		})
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
