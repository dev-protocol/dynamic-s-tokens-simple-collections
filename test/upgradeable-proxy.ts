/* eslint-disable @typescript-eslint/naming-convention */
import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { deploy, deployProxy } from './utils'
import type { SimpleCollections, UpgradeableProxy } from '../typechain-types'
import { constants } from 'ethers'

use(solidity)

describe('UpgradeableProxy', () => {
	const init = async (): Promise<
		[UpgradeableProxy, SimpleCollections, SimpleCollections]
	> => {
		const data = ethers.utils.arrayify('0x')
		const cont = await deploy<SimpleCollections>('SimpleCollections')
		const [owner, addr1, swap] = await ethers.getSigners()
		const proxy = await deployProxy(cont.address, owner.address, data)
		const proxified = cont.attach(proxy.address).connect(addr1)
		await proxified.initialize(swap.address, constants.AddressZero)

		return [proxy, cont, proxified]
	}

	describe('upgradeTo', () => {
		describe('success', () => {
			it('upgrade logic contract', async () => {
				const [proxy, impl] = await init()
				const impl1 = await proxy.callStatic.implementation()
				const nextImpl = await deploy<SimpleCollections>('SimpleCollections')
				await proxy.upgradeTo(nextImpl.address)
				const impl2 = await proxy.callStatic.implementation()
				expect(impl1).to.not.equal(impl2)
				expect(impl1).to.equal(impl.address)
				expect(impl2).to.equal(nextImpl.address)
			})

			it('storing data', async () => {
				const [, propertyAuthor, gateway] = await ethers.getSigners()
				const [proxy, , proxified] = await init()
				const property = await (
					await ethers.getContractFactory('Property')
				).deploy(propertyAuthor.address, 'Testing', 'TEST')
				await proxified.setImages(
					property.address,
					[
						{
							src: 'SRC',
							name: 'NAME',
							description: 'DESC',
							requiredETHAmount: constants.Zero,
							requiredETHFee: constants.Zero,
							gateway: gateway.address,
						},
					],
					[constants.HashZero]
				)
				const nextImpl = await deploy<SimpleCollections>('SimpleCollections')
				await proxy.upgradeTo(nextImpl.address)
				const value = await proxified.image(
					1,
					constants.AddressZero,
					{
						property: property.address,
						amount: constants.Zero,
						price: constants.Zero,
						cumulativeReward: constants.Zero,
						pendingReward: constants.Zero,
					},
					{
						entireReward: constants.Zero,
						cumulativeReward: constants.Zero,
						withdrawableReward: constants.Zero,
					},
					constants.HashZero
				)
				expect(value).to.equal('SRC')
			})
		})
		describe('fail', () => {
			it('should fail to upgrade when the caller is not admin', async () => {
				const [proxy, impl] = await init()
				const nextImpl = await deploy<SimpleCollections>('SimpleCollections')
				const [, addr1] = await ethers.getSigners()
				const res = await proxy
					.connect(addr1)
					.upgradeTo(nextImpl.address)
					.catch((err: Error) => err)
				const impl1 = await proxy.callStatic.implementation()
				expect(res).to.be.instanceOf(Error)
				expect(impl1).to.be.equal(impl.address)
			})
		})
	})
})
