/* eslint-disable @typescript-eslint/naming-convention */
import { utils } from 'ethers'
import { ethers } from 'hardhat'
import type {
	SimpleCollections,
	SimpleCollections__factory,
} from '../typechain-types'

const DEPLOYED_ADDRESS = ''
const PROPERTY_ADDRESS = ''
const IMAGES: SimpleCollections.ImageStruct[] = [
	{
		src: '',
		name: '',
		description: '',
		requiredETHAmount: utils.parseEther('0'),
		requiredETHFee: utils.parseEther('0'),
		gateway: '',
	},
]
const KEYS: Uint8Array[] = [utils.toUtf8Bytes('A'), utils.toUtf8Bytes('B')]

async function main() {
	const contract = (await ethers.getContractFactory(
		'SimpleCollections'
	)) as SimpleCollections__factory
	const deployedContract = contract.attach(DEPLOYED_ADDRESS)
	await deployedContract.setImages(
		PROPERTY_ADDRESS,
		IMAGES,
		KEYS.map(utils.keccak256)
	)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
