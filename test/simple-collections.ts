import { expect, use } from 'chai'
import { BigNumber } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { deployWithProxy, toBigNumber } from './utils'
import { SimpleCollections } from '../typechain-types'

use(solidity)

describe('SimpleCollections', () => {
	describe('initialize', () => {
		describe('success', () => {
			it('initializing', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				await cont.initialize()
				const owner = await cont.owner()
				expect(owner).to.equal('3')
			})
		})
		describe('fail', () => {
			it('should fail to initialize when already initialized', async () => {
				const cont = await deployWithProxy<SimpleCollections>(
					'SimpleCollections'
				)
				await cont.initialize()

				await expect(cont.initialize()).to.be.revertedWith(
					'Initializable: contract is already initialized'
				)
			})
		})
	})

	describe('setImages')

	describe('removeImages')

	describe('onBeforeMint')

	describe('image')
})
