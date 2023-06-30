import { expect, use } from 'chai'
import type { BigNumberish, ContractFactory } from 'ethers'
import { constants, utils } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { deployWithProxy } from './utils'
import {
	type MockFiatOracle,
	type FiatSimpleCollections,
	type MockUniswapPool,
	type SimpleCollections,
} from '../typechain-types'
import { ethers, waffle } from 'hardhat'
// Import * as uniswapPair from '../artifacts/@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json'
// const { deployMockContract, provider } = waffle

describe('FiatSimpleCollections', () => {
	let mockUniswapPool: MockUniswapPool

	before(async () => {
		const [owner] = await ethers.getSigners()

		// Deploy the mock Uniswap pool before each test
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const MockUniswapPoolFactory: ContractFactory =
			await ethers.getContractFactory('MockUniswapPool')

		const mockWmatic = await (
			await ethers.getContractFactory('Property')
		).deploy(owner.address, 'Mock WMatic', 'WMATIC')

		const mockUsdc = await (
			await ethers.getContractFactory('Property')
		).deploy(owner.address, 'Mock USDC', 'USDC')

		mockUniswapPool = (await MockUniswapPoolFactory.deploy(
			mockUsdc.address,
			mockWmatic.address
		)) as MockUniswapPool
		await mockUniswapPool.deployed()

		await mockUniswapPool.addLiquidity(1_000, 2_000)

		// Deploy mock price oracle
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const MockPriceOracleFactory: ContractFactory =
			await ethers.getContractFactory('MockPriceOracle')

		const mockPriceOracle =
			(await MockPriceOracleFactory.deploy()) as MockFiatOracle

		const fiatSimpleCollections = await deployWithProxy<FiatSimpleCollections>(
			'FiatSimpleCollectionsFactory'
		)

		const swapAndStake = await (
			await ethers.getContractFactory('SwapAndStake')
		).deploy(fiatSimpleCollections.address)

		await fiatSimpleCollections.initialize(
			swapAndStake.address,
			mockUniswapPool.address,
			mockPriceOracle.address
		)
	})
})
