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

const structImage = (
	src: string,
	name: string,
	description: string,
	requiredFiatAmount: BigNumberish,
	requiredFiatFee: BigNumberish,
	gateway: string,
	token: string
) => ({
	src,
	name,
	description,
	requiredFiatAmount,
	requiredFiatFee,
	gateway,
	token,
})

describe('FiatSimpleCollections', () => {
	let mockUniswapPool: MockUniswapPool
	let fiatSimpleCollections: FiatSimpleCollections

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

		await mockWmatic.approve(mockUniswapPool.address, constants.MaxUint256)
		await mockUsdc.approve(mockUniswapPool.address, constants.MaxUint256)

		await mockUniswapPool.addLiquidity(1_000, 2_000)

		// Deploy mock price oracle
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const MockPriceOracleFactory: ContractFactory =
			await ethers.getContractFactory('MockFiatOracle')

		const mockPriceOracle =
			(await MockPriceOracleFactory.deploy()) as MockFiatOracle

		fiatSimpleCollections = await deployWithProxy<FiatSimpleCollections>(
			'FiatSimpleCollections'
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

	describe('setImages', () => {
		describe('success', () => {
			it('set the images', async () => {
				// Const cont = await deployWithProxy<ERC20SimpleCollections>(
				// 	'ERC20SimpleCollections'
				// )

				const cont = fiatSimpleCollections

				const [owner] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				// Await cont.initialize(swap.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const y = utils.keccak256(utils.toUtf8Bytes('Y'))
				const fiatAmount = utils.parseEther('100')
				const fiatFee = utils.parseEther('1')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							fiatAmount,
							fiatFee,
							owner.address,
							owner.address // TODO: change this address to token address.
						),
						structImage(
							'Y_SRC',
							'Y_NAME',
							'Y_DESC',
							fiatAmount,
							fiatFee,
							owner.address,
							owner.address // TODO: change this address to token address.
						),
					],
					[x, y]
				)
				const image1 = await cont.propertyImages(property.address, x)
				const image2 = await cont.propertyImages(property.address, y)
				expect(image1.src).to.equal('X_SRC')
				expect(image1.name).to.equal('X_NAME')
				expect(image1.description).to.equal('X_DESC')
				expect(image1.requiredFiatAmount).to.equal(fiatAmount)
				expect(image1.requiredFiatFee).to.equal(fiatFee)
				expect(image2.src).to.equal('Y_SRC')
				expect(image2.name).to.equal('Y_NAME')
				expect(image2.description).to.equal('Y_DESC')
				expect(image2.requiredFiatAmount).to.equal(fiatAmount)
				expect(image2.requiredFiatFee).to.equal(fiatFee)
			})
		})
		describe('fail', () => {
			it('should fail to call when the sender is not the owner', async () => {
				// Const cont = await deployWithProxy<ERC20SimpleCollections>(
				// 	'ERC20SimpleCollections'
				// )
				const cont = fiatSimpleCollections
				const [owner, addr1] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				// Await cont.initialize(swap.address)
				await expect(
					cont.connect(addr1).setImages(
						property.address,
						[
							structImage(
								'X_SRC',
								'X_NAME',
								'X_DESC',
								utils.parseEther('1'),
								utils.parseEther('0.01'),
								owner.address,
								owner.address // TODO: change this address to token address.
							),
						],
						[utils.keccak256(utils.toUtf8Bytes('X'))]
					)
				).to.be.revertedWith('illegal access')
			})
		})
	})
})
