// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "@devprotocol/i-s-tokens/contracts/interface/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interface/ISTokensManagerStruct.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/ISwapAndStake.sol";

contract SimpleCollections is ITokenURIDescriptor, OwnableUpgradeable {
	struct Image {
		string src;
		uint256 requiredETHAmount;
		uint256 requiredETHFee;
	}

	ISwapAndStake public swapAndStake;
	address public gateway;
	mapping(bytes32 => Image) public images;
	mapping(uint256 => uint256) public stakedAmountAtMinted;

	function initialize() external initializer {
		__Ownable_init();
	}

	function image(
		uint256 id,
		address,
		ISTokensManagerStruct.StakingPositions memory _positions,
		ISTokensManagerStruct.Rewards memory,
		bytes32 key
	) external view returns (string memory) {
		Image memory img = images[key];
		uint256 stakedAtMinted = stakedAmountAtMinted[id];
		if (stakedAtMinted > _positions.amount) {
			return "";
		}
		return img.src;
	}

	function setImages(Image[] memory _images, bytes32[] memory _keys)
		external
		onlyOwner
	{
		for (uint256 i = 0; i < _images.length; i++) {
			Image memory img = _images[i];
			bytes32 key = _keys[i];
			images[key] = img;
		}
	}

	function removeImage(bytes32 _key) external onlyOwner {
		delete images[_key];
	}

	function setGateway(address _contract, address _gateway)
		external
		onlyOwner
	{
		swapAndStake = ISwapAndStake(_contract);
		gateway = _gateway;
	}

	function onBeforeMint(
		uint256 id,
		address,
		ISTokensManagerStruct.StakingPositions memory _positions,
		bytes32 key
	) external returns (bool) {
		Image memory img = images[key];

		// Always only allow staking via the SwapAndStake contract.
		ISwapAndStake.Amounts memory stakeVia = swapAndStake.gatewayOf(gateway);

		// Validate the staking position.
		bool valid = img.requiredETHAmount <= stakeVia.input &&
			img.requiredETHFee <= stakeVia.fee;

		if (valid) {
			stakedAmountAtMinted[id] = _positions.amount;
		}

		return valid;
	}
}
