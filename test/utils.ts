import { ethers } from 'hardhat'
import { Contract, BigNumber } from 'ethers'

export const deploy = async <C extends Contract>(name: string): Promise<C> => {
	const factory = await ethers.getContractFactory(name)
	const contract = await factory.deploy()
	await contract.deployed()
	return contract as C
}

export const toBigNumber = (v: string | number | BigNumber): BigNumber =>
	BigNumber.from(v)
