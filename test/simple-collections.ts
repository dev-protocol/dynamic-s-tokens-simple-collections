/* eslint-disable @typescript-eslint/naming-convention */
import { expect, use } from 'chai'
import { utils } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { deploy } from './utils'
import { SimpleCollections } from '../typechain-types'
import { ethers } from 'hardhat'

use(solidity)

describe('SimpleCollections', () => {
	describe('setImages', () => {
		describe('success', () => {
			it('set the images', async () => {
				const cont = await deploy<SimpleCollections>('SimpleCollections')
				const x = utils.keccak256(utils.toUtf8Bytes('X'))
				const y = utils.keccak256(utils.toUtf8Bytes('Y'))
				const eth1 = utils.parseEther('1')
				const eth001 = utils.parseEther('0.01')
				await cont.setImages(
					[
						{
							src: 'X_SRC',
							requiredETHAmount: eth1,
							requiredETHFee: eth001,
						},
						{
							src: 'Y_SRC',
							requiredETHAmount: eth1,
							requiredETHFee: eth001,
						},
					],
					[x, y]
				)
				const image1 = await cont.images(x)
				const image2 = await cont.images(y)
				expect(image1.src).to.equal('X_SRC')
				expect(image1.requiredETHAmount).to.equal(eth1)
				expect(image1.requiredETHFee).to.equal(eth001)
				expect(image2.src).to.equal('Y_SRC')
				expect(image2.requiredETHAmount).to.equal(eth1)
				expect(image2.requiredETHFee).to.equal(eth001)
			})
		})
		describe('fail', () => {
			it('should fail to call when the sender is not the owner', async () => {
				const cont = await deploy<SimpleCollections>('SimpleCollections')
				const [, addr1] = await ethers.getSigners()

				await expect(
					cont.connect(addr1).setImages(
						[
							{
								src: 'X_SRC',
								requiredETHAmount: utils.parseEther('1'),
								requiredETHFee: utils.parseEther('0.01'),
							},
						],
						[utils.keccak256(utils.toUtf8Bytes('X'))]
					)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})

	describe.skip('removeImages', () => {
		describe('success', () => {
			it('remove the images')
		})
		describe('fail', () => {
			it('should fail to call when the sender is not owner')
		})
	})

	describe.skip('onBeforeMint', () => {
		describe('success', () => {
			it(
				'returns true if receives the defined bytes32 key and passes validation'
			)

			it('update stakedAmountAtMinted when returning true')
		})
		describe('fail', () => {
			it('should fail to call when the sender is not STokensManager')

			it('returns false if the received bytes32 key is not defined')

			it('returns false if not passed validation')
		})
	})

	describe.skip('image', () => {
		describe('success', () => {
			it(
				'returns correct image if the received bytes32 key is exists and staked amount is not changed'
			)

			it(
				'returns correct image if the received bytes32 key is exists and staked amount is increased'
			)
		})
		describe('fail', () => {
			it('returns empty string if the received bytes32 key is not defined')

			it('returns empty string if the staked amount is decreased')
		})
	})
})
