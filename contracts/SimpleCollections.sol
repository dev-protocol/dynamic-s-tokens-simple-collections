// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IProperty.sol";
import "./interfaces/ISwapAndStake.sol";

contract SimpleCollections is ITokenURIDescriptor, OwnableUpgradeable {
	struct Image {
		string src;
		uint256 requiredETHAmount;
		uint256 requiredETHFee;
	}

	ISwapAndStake public swapAndStake;
    mapping(address => address) public gateway;
	mapping(address => mapping(bytes32 => Image)) public propertyImages;
	mapping(address => mapping(uint256 => uint256)) public stakedAmountAtMinted;
	function initialize() external initializer {
		__Ownable_init();
	}

	modifier onlyPropertyAuthor(address _property) {
		address author = IProperty(_property).author();
		require(author == _msgSender(), "illegal access");
		_;
	}

	function image(
		uint256 id,
		address,
		ISTokensManagerStruct.StakingPositions memory _positions,
		ISTokensManagerStruct.Rewards memory,
		bytes32 key
	) external view returns (string memory) {
		Image memory img = propertyImages[_positions.property][key];
		uint256 stakedAtMinted = stakedAmountAtMinted[_positions.property][id];
		if (stakedAtMinted > _positions.amount) {
			return "";
		}
		return img.src;
	}

	function setImages(
        ISTokensManagerStruct.StakingPositions memory _positions,
        Image[] memory _images, 
        bytes32[] memory _keys)
		external
		onlyPropertyAuthor(_positions.property)
	{

		for (uint256 i = 0; i < _images.length; i++) {
			Image memory img = _images[i];
			bytes32 key = _keys[i];
			propertyImages[_positions.property][key] = img;
		}
	}

	function removeImage(
        ISTokensManagerStruct.StakingPositions memory _positions,
        bytes32 _key
    ) external onlyPropertyAuthor(_positions.property) {
		delete propertyImages[_positions.property][_key];
	}

	function setGateway(
        ISTokensManagerStruct.StakingPositions memory _positions,
        address _contract, 
        address _gateway)
		external
        onlyPropertyAuthor(_positions.property)
	{
		swapAndStake = ISwapAndStake(_contract);
		gateway[_positions.property] = _gateway;
	}

	function onBeforeMint(
		uint256 id,
		address,
		ISTokensManagerStruct.StakingPositions memory _positions,
		bytes32 key
	) external returns (bool) {
		Image memory img = propertyImages[_positions.property][key];

		// When not defined the key
		if (
			bytes(img.src).length == 0 ||
			img.requiredETHAmount == 0 ||
			img.requiredETHFee == 0
		) {
			return false;
		}

		// Always only allow staking via the SwapAndStake contract.
		ISwapAndStake.Amounts memory stakeVia = swapAndStake.gatewayOf(gateway[_positions.property]);

		// Validate the staking position.
		bool valid = img.requiredETHAmount <= stakeVia.input &&
			img.requiredETHFee <= stakeVia.fee;

		if (valid) {
			stakedAmountAtMinted[_positions.property][id] = _positions.amount;
		}

		return valid;
	}
}
