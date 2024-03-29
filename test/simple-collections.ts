/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
/* eslint-disable @typescript-eslint/naming-convention */
import { expect, use } from 'chai'
import type { BigNumberish } from 'ethers'
import { constants, utils } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { deployWithProxy } from './utils'
import type { SimpleCollections } from '../typechain-types'
import { ethers } from 'hardhat'

use(solidity)

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
const structRewards = ({
	entireReward,
	cumulativeReward,
	withdrawableReward,
}: {
	entireReward?: BigNumberish
	cumulativeReward?: BigNumberish
	withdrawableReward?: BigNumberish
} = {}) => ({
	entireReward: entireReward ? entireReward : constants.Zero,
	cumulativeReward: cumulativeReward ? cumulativeReward : constants.Zero,
	withdrawableReward: withdrawableReward ? withdrawableReward : constants.Zero,
})
const structImage = (
	src: string,
	name: string,
	description: string,
	requiredETHAmount: BigNumberish,
	requiredETHFee: BigNumberish,
	gateway: string
) => ({
	src,
	name,
	description,
	requiredETHAmount,
	requiredETHFee,
	gateway,
})
describe('SimpleCollections', () => {
	describe('initialize', () => {
		describe('success', () => {
			it('initializing', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [addr1, addr2] = await ethers.getSigners()
				await cont.initialize(addr2.address)
				const owner = await cont.owner()
				expect(owner).to.equal(addr1.address)
			})
		})
		describe('fail', () => {
			it('should fail to initialize when already initialized', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [, addr2] = await ethers.getSigners()
				await cont.initialize(addr2.address)

				await expect(cont.initialize(addr2.address)).to.be.revertedWith(
					'Initializable: contract is already initialized'
				)
			})
		})
	})
	describe('setImages', () => {
		describe('success', () => {
			it('set the images', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [owner, swap] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swap.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const y = utils.keccak256(utils.toUtf8Bytes('Y'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							owner.address
						),
						structImage(
							'Y_SRC',
							'Y_NAME',
							'Y_DESC',
							eth1,
							eth001,
							owner.address
						),
					],
					[x, y]
				)
				const image1 = await cont.propertyImages(property.address, x)
				const image2 = await cont.propertyImages(property.address, y)
				expect(image1.src).to.equal('X_SRC')
				expect(image1.name).to.equal('X_NAME')
				expect(image1.description).to.equal('X_DESC')
				expect(image1.requiredETHAmount).to.equal(eth1)
				expect(image1.requiredETHFee).to.equal(eth001)
				expect(image2.src).to.equal('Y_SRC')
				expect(image2.name).to.equal('Y_NAME')
				expect(image2.description).to.equal('Y_DESC')
				expect(image2.requiredETHAmount).to.equal(eth1)
				expect(image2.requiredETHFee).to.equal(eth001)
			})
		})
		describe('fail', () => {
			it('should fail to call when the sender is not the owner', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [owner, swap, addr1] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swap.address)
				await expect(
					cont
						.connect(addr1)
						.setImages(
							property.address,
							[
								structImage(
									'X_SRC',
									'X_NAME',
									'X_DESC',
									utils.parseEther('1'),
									utils.parseEther('0.01'),
									owner.address
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
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [owner, swap] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swap.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const y = utils.keccak256(utils.toUtf8Bytes('Y'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							owner.address
						),
						structImage(
							'Y_SRC',
							'Y_NAME',
							'Y_DESC',
							eth1,
							eth001,
							owner.address
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
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [owner, swap, addr1] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swap.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const y = utils.keccak256(utils.toUtf8Bytes('Y'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							owner.address
						),
						structImage(
							'Y_SRC',
							'Y_NAME',
							'Y_DESC',
							eth1,
							eth001,
							owner.address
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
	describe('onBeforeMint', () => {
		describe('success', () => {
			it('returns true if receives the defined bytes32 key and passes validation', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				const res = await swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{ input: eth1, fee: eth001, token: constants.AddressZero },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				expect(res).to.equal(true)
			})

			it('update stakedAmountAtMinted when returning true', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)

				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				await swapAndStake.__mock(
					9,
					gateway.address,
					{ input: eth1, fee: eth001, token: constants.AddressZero },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				const res = await cont.stakedAmountAtMinted(property.address, 9)

				expect(res).to.equal(utils.parseEther('3'))
			})
		})
		describe('fail', () => {
			it('should fail to call when the calling is not internal call from SwapAndStake', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)

				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)
				const [owner, gateway] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				const res = await cont.callStatic.onBeforeMint(
					9,
					gateway.address,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				expect(res).to.equal(false)
			})

			it('returns false if the received bytes32 key is not defined', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)

				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)
				const [owner, gateway] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				const res = await swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{ input: eth1, fee: eth001, token: constants.AddressZero },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					utils.keccak256(utils.toUtf8Bytes('XYZ'))
				)

				expect(res).to.equal(false)
			})

			it('returns false if not passed validation for requiredETHAmount', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)
				const [owner, gateway] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				const res = await swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{
						input: utils.parseEther('0.999'),
						fee: eth001,
						token: constants.AddressZero,
					},
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				expect(res).to.equal(false)
			})

			it('returns false if not passed validation for requiredETHFee', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)
				const [owner, gateway] = await ethers.getSigners()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				const res = await swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{
						input: eth1,
						fee: utils.parseEther('0.00999'),
						token: constants.AddressZero,
					},
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				expect(res).to.equal(false)
			})

			it('should fail when the token address of the gateway is not WETH', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				const wethAddress = utils.getAddress(
					'0x0000000000000000000000000000000000000001'
				)

				await cont.setWeth(wethAddress)

				const call = swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{ input: eth1, fee: eth001, token: constants.AddressZero },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				await expect(call).to.revertedWith('illegal gateway')
			})
		})
	})
	describe('image', () => {
		describe('success', () => {
			it('returns correct image if the received bytes32 key is exists and staked amount is not changed', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)

				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				await swapAndStake.__mock(
					9,
					gateway.address,
					{ input: eth1, fee: eth001, token: constants.AddressZero },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				const image = await cont.image(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				const name = await cont.name(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				const description = await cont.description(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				expect(image).to.equal('X_SRC')
				expect(name).to.equal('X_NAME')
				expect(description).to.equal('X_DESC')
			})

			it('returns correct image if the received bytes32 key is exists and staked amount is increased', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				await swapAndStake.__mock(
					9,
					gateway.address,
					{ input: eth1, fee: eth001, token: constants.AddressZero },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				const image = await cont.image(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				const name = await cont.name(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				const description = await cont.description(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				expect(image).to.equal('X_SRC')
				expect(name).to.equal('X_NAME')
				expect(description).to.equal('X_DESC')
			})

			it('returns correct image if the received bytes32 key is exists and its calling is simulations call', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				// In this test case, doesn't staked

				const image = await cont.image(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				const name = await cont.name(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				const description = await cont.description(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					x
				)

				expect(image).to.equal('X_SRC')
				expect(name).to.equal('X_NAME')
				expect(description).to.equal('X_DESC')
			})
		})
		describe('fail', () => {
			it('returns empty string if the received bytes32 key is not defined', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)

				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				await swapAndStake.__mock(
					9,
					gateway.address,
					{ input: eth1, fee: eth001, token: constants.AddressZero },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				const res = await cont.image(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					structRewards(),
					utils.keccak256(utils.toUtf8Bytes('XYZ'))
				)

				expect(res).to.equal('')
			})

			it('returns empty string if the staked amount is decreased', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)

				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				await swapAndStake.__mock(
					9,
					gateway.address,
					{ input: eth1, fee: eth001, token: constants.AddressZero },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)

				const res = await cont.image(
					9,
					constants.AddressZero,
					structPositions({
						property: property.address,
						amount: utils.parseEther('2.999'),
					}),
					structRewards(),
					utils.keccak256(utils.toUtf8Bytes('XYZ'))
				)

				expect(res).to.equal('')
			})
		})
	})
	describe('setSwapAndStake', () => {
		describe('success', () => {
			it('can set swapAndStake', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [addr1, swapAndStake, swapAndStakeChanged] =
					await ethers.getSigners()
				await cont.initialize(swapAndStake.address)
				const owner = await cont.owner()
				expect(owner).to.equal(addr1.address)
				expect(await cont.swapAndStake()).to.equal(swapAndStake.address)

				// After setSwapAndStake
				await cont.setSwapAndStake(swapAndStakeChanged.address)
				expect(await cont.swapAndStake()).to.equal(swapAndStakeChanged.address)
			})
		})
		describe('fail', () => {
			it('cannot set swapAndStake if not owner', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [addr1, addr2, swapAndStake, swapAndStakeChanged] =
					await ethers.getSigners()
				await cont.initialize(swapAndStake.address)
				const owner = await cont.owner()
				expect(owner).to.equal(addr1.address)
				expect(await cont.swapAndStake()).to.equal(swapAndStake.address)

				// After setSwapAndStake
				await expect(
					cont.connect(addr2).setSwapAndStake(swapAndStakeChanged.address)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
	describe('setWeth', () => {
		describe('success', () => {
			it('can set weth', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const swapAndStake = await (
					await ethers.getContractFactory('SwapAndStake')
				).deploy(cont.address)

				const [owner, gateway] = await ethers.getSigners()

				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(owner.address, 'Testing', 'TEST')
				await cont.initialize(swapAndStake.address)
				const wethAddress = utils.getAddress(
					'0x0000000000000000000000000000000000000001'
				)

				await cont.setWeth(wethAddress)

				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					property.address,
					[
						structImage(
							'X_SRC',
							'X_NAME',
							'X_DESC',
							eth1,
							eth001,
							gateway.address
						),
					],
					[x]
				)

				const res = await swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{ input: eth1, fee: eth001, token: wethAddress },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)
				expect(res).to.equal(true)

				const wethAddress2 = utils.getAddress(
					'0x0000000000000000000000000000000000000002'
				)

				await cont.setWeth(wethAddress2)

				// After changed the weth address
				const res2 = await swapAndStake.callStatic.__mock(
					1,
					gateway.address,
					{ input: eth1, fee: eth001, token: wethAddress2 },
					structPositions({
						property: property.address,
						amount: utils.parseEther('3'),
					}),
					x
				)
				expect(res2).to.equal(true)
			})
		})
		describe('fail', () => {
			it('cannot set weth if not owner', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				const [addr1, addr2, swapAndStake] = await ethers.getSigners()
				await cont.initialize(swapAndStake.address)
				const owner = await cont.owner()
				expect(owner).to.equal(addr1.address)

				const wethAddress = utils.getAddress(
					'0x0000000000000000000000000000000000000001'
				)

				await expect(
					cont.connect(addr2).setWeth(wethAddress)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
})
