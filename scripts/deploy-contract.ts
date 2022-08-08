import { ethers } from 'hardhat'
import { SimpleCollections__factory } from '../typechain-types'
import { deployAdmin, deployProxy } from './utils'

async function main() {
	const contract = (await ethers.getContractFactory(
		'SimpleCollections'
	)) as SimpleCollections__factory
	const deployedContract = await contract.deploy()

	const admin = await deployAdmin()

	const upgradeableProxy = await deployProxy(
		deployedContract.address,
		admin.address,
		ethers.utils.arrayify('0x')
	)

	console.log('Example address:', deployedContract.address)
	console.log('Admin address:', admin.address)
	console.log('UpgradeableProxy address:', upgradeableProxy.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
