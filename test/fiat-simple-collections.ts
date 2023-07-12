import { expect, use } from 'chai'
import type { BigNumberish, ContractFactory } from 'ethers'
import { BigNumber, constants, utils } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { deployWithProxy } from './utils'
import {
	type MockFiatOracle,
	type FiatSimpleCollections,
	type MockUniswapPool,
	type SimpleCollections,
	type SwapAndStake,
} from '../typechain-types'
import { ethers, waffle } from 'hardhat'
// Import * as uniswapPair from '../artifacts/@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json'
// const { deployMockContract, provider } = waffle

const structPositions = ({
	property,
	amount,
	price,
	cumulativeReward,
	pendingReward,
}: {
	property?: string
	amount?: BigNumberish
	price?: BigNumberish
	cumulativeReward?: BigNumberish
	pendingReward?: BigNumberish
} = {}) => ({
	property: property ? property : constants.AddressZero,
	amount: amount ? amount : constants.Zero,
	price: price ? price : constants.Zero,
	cumulativeReward: cumulativeReward ? cumulativeReward : constants.Zero,
	pendingReward: pendingReward ? pendingReward : constants.Zero,
})

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
	let swapAndStake: SwapAndStake

	beforeEach(async () => {
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

		swapAndStake = (await (
			await ethers.getContractFactory('SwapAndStake')
		).deploy(fiatSimpleCollections.address)) as SwapAndStake

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
	describe('removeImages', () => {
		describe('success', () => {
			it('remove the images', async () => {
				const cont = fiatSimpleCollections
				const [owner, swap] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const y = utils.keccak256(utils.toUtf8Bytes('Y'))
				const fiatAmount = utils.parseEther('1')
				const fiatFee = utils.parseEther('0.01')
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

				expect((await cont.propertyImages(property.address, x)).src).to.equal(
					'X_SRC'
				)

				expect((await cont.propertyImages(property.address, x)).name).to.equal(
					'X_NAME'
				)

				expect(
					(await cont.propertyImages(property.address, x)).description
				).to.equal('X_DESC')

				await cont.removeImage(property.address, x)

				expect((await cont.propertyImages(property.address, x)).src).to.equal(
					''
				)
				expect((await cont.propertyImages(property.address, x)).name).to.equal(
					''
				)
				expect(
					(await cont.propertyImages(property.address, x)).description
				).to.equal('')
			})
		})
		describe('fail', () => {
			it('should fail to call when the sender is not owner', async () => {
				const cont = fiatSimpleCollections
				const [owner, addr1] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const y = utils.keccak256(utils.toUtf8Bytes('Y'))
				const fiatAmount = utils.parseEther('1')
				const fiatFee = utils.parseEther('0.01')
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

				expect((await cont.propertyImages(property.address, x)).src).to.equal(
					'X_SRC'
				)

				expect((await cont.propertyImages(property.address, x)).name).to.equal(
					'X_NAME'
				)

				expect(
					(await cont.propertyImages(property.address, x)).description
				).to.equal('X_DESC')

				await expect(
					cont.connect(addr1).removeImage(property.address, x)
				).to.be.revertedWith('illegal access')
			})
		})
	})

	describe('fiatToNative', () => {
		describe('success', () => {
			// JPY/USD price: 1 yen == $0.00700000 (700000)
			// USD/JPY price 1 USD == 142.857 yen
			// Matic/USD price: 1 MATIC == 0.50 USDC
			// --------------------------------------------------------------
			// 1 MATIC == 0.50 USDC == 0.50 / 0.007 yen == 71.42857142857143 yen

			it('should return native value in fiat currency', async () => {
				const cont = fiatSimpleCollections

				const res = await cont.nativeToFiat()
				console.log('res is: ', res.toString())
				expect(res).to.equal(BigNumber.from('71428571428571428571'))
			})
		})
	})

	describe('onBeforeMint', () => {
		// Matic price should be 0.50 USDC
		// JPY fiat amount should be 100 yen
		// JPY fiat fee should be 1 yen
		// JPY/USD price: 1 yen == $0.00700000 (700000)
		// ==============================================================
		// required USD should be (100 yen * 0.0070) == 0.70 USD
		// required Matic should be (0.70 USD / 0.50 USD) == 1.4 Matic (1400000000000000000)
		// required USD fee should be (1 yen * 0.0070) == 0.007 USD
		// required Matic fee should be (0.007 USD / 0.50 USD) == 0.014 Matic (14000000000000)

		describe('success', () => {
			it('returns true if receives the defined bytes32 key and passes validation', async () => {
				const cont = fiatSimpleCollections
				const [owner, gateway] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				// eslint-disable-next-line @typescript-eslint/naming-convention
				const imagePriceInJPY = utils.parseEther('100')
				// eslint-disable-next-line @typescript-eslint/naming-convention
				const imageFeeInJPY = utils.parseEther('1')
				const maticAmount = utils.parseEther('1.4')
				const maticFee = utils.parseEther('0.014')

				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							imagePriceInJPY,
							imageFeeInJPY,
							gateway.address,
							owner.address // TODO: change this address to token address.
						),
					],
					[x]
				)

				const res = await swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{ input: maticAmount, fee: maticFee },
					structPositions({
						property: property.address,
						amount: utils.parseEther('1'),
					}),
					x
				)

				expect(res).to.eq(true)
			})
		})
		describe('fail', () => {
			it('returns false if receives Matic amount sent is less than required JPY', async () => {
				expect(true).to.eq(true)

				const cont = fiatSimpleCollections
				const [owner, gateway] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				// eslint-disable-next-line @typescript-eslint/naming-convention
				const imagePriceInJPY = utils.parseEther('100')
				// eslint-disable-next-line @typescript-eslint/naming-convention
				const imageFeeInJPY = utils.parseEther('1')
				const maticAmount = utils.parseEther('1.3')
				const maticFee = utils.parseEther('0.013')

				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							imagePriceInJPY,
							imageFeeInJPY,
							gateway.address,
							owner.address // TODO: change this address to token address.
						),
					],
					[x]
				)

				const res = await swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{ input: maticAmount, fee: maticFee },
					structPositions({
						property: property.address,
						amount: utils.parseEther('1'),
					}),
					x
				)

				expect(res).to.eq(false)
			})
		})
	})
})
