/* eslint-disable @typescript-eslint/naming-convention */
import { ethers } from 'hardhat'
import type {
	Admin__factory,
	SimpleCollections__factory,
} from '../typechain-types'

const { ADMIN, DEPLOYED_ADDRESS } = process.env as {
	ADMIN: ''
	DEPLOYED_ADDRESS: ''
}

async function main() {
	const adminFactory = (await ethers.getContractFactory(
		'Admin'
	)) as Admin__factory
	const simpleCollectionsFactory = (await ethers.getContractFactory(
		'SimpleCollections'
	)) as SimpleCollections__factory
	const newSimpleCollections = await simpleCollectionsFactory.deploy()

	const admin = adminFactory.attach(ADMIN)

	await admin.upgrade(DEPLOYED_ADDRESS, newSimpleCollections.address)

	console.log('new simple collections:', newSimpleCollections.address)
	console.log(
		'new implementation:',
		await admin.getProxyImplementation(DEPLOYED_ADDRESS)
	)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
