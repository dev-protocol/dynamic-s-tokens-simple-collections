// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IProperty.sol";
import "./interfaces/ISwapAndStake.sol";

contract ERC20SimpleCollections is ITokenURIDescriptor, OwnableUpgradeable {
	struct Image {
		string src;
		string name;
		string description;
		uint256 requiredTokenAmount;
		uint256 requiredTokenFee;
		address gateway;
		address token;
	}

	ISwapAndStake public swapAndStake;
	mapping(address => mapping(bytes32 => Image)) public propertyImages;
	mapping(address => mapping(uint256 => uint256)) public stakedAmountAtMinted;
	mapping(address => bool) public allowlistedTokens;
	address public dev;

	function initialize(address _contract) external initializer {
		__Ownable_init();
		swapAndStake = ISwapAndStake(_contract);
	}

	modifier onlyPropertyAuthor(address _property) {
		address _owner_ = owner();
		address author = IProperty(_property).author();
		require(
			author == _msgSender() || _owner_ == _msgSender(),
			"illegal access"
		);
		_;
	}

	function setSwapAndStake(address _contract) external onlyOwner {
		swapAndStake = ISwapAndStake(_contract);
	}

	function allowListToken(address _token) external onlyOwner {
		allowlistedTokens[_token] = true;
	}

	function denyListToken(address _token) external onlyOwner {
		allowlistedTokens[_token] = false;
	}

	function setDevToken(address _dev) external onlyOwner {
		dev = _dev;
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
		if (_positions.price > 0 && stakedAtMinted > _positions.amount) {
			return "";
		}
		return img.src;
	}

	function name(
		uint256 id,
		address,
		ISTokensManagerStruct.StakingPositions memory _positions,
		ISTokensManagerStruct.Rewards memory,
		bytes32 key
	) external view returns (string memory) {
		Image memory img = propertyImages[_positions.property][key];
		uint256 stakedAtMinted = stakedAmountAtMinted[_positions.property][id];
		if (_positions.price > 0 && stakedAtMinted > _positions.amount) {
			return "";
		}
		return img.name;
	}

	function description(
		uint256 id,
		address,
		ISTokensManagerStruct.StakingPositions memory _positions,
		ISTokensManagerStruct.Rewards memory,
		bytes32 key
	) external view returns (string memory) {
		Image memory img = propertyImages[_positions.property][key];
		uint256 stakedAtMinted = stakedAmountAtMinted[_positions.property][id];
		if (_positions.price > 0 && stakedAtMinted > _positions.amount) {
			return "";
		}
		return img.description;
	}

	function setImages(
		address _propertyAddress,
		Image[] memory _images,
		bytes32[] memory _keys
	) external onlyPropertyAuthor(_propertyAddress) {
		for (uint256 i = 0; i < _images.length; i++) {
			Image memory img = _images[i];
			bytes32 key = _keys[i];
			propertyImages[_propertyAddress][key] = img;
		}
	}

	function removeImage(
		address _propertyAddress,
		bytes32 _key
	) external onlyPropertyAuthor(_propertyAddress) {
		delete propertyImages[_propertyAddress][_key];
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
			bytes(img.src).length == 0 &&
			img.requiredTokenAmount == 0 &&
			img.requiredTokenFee == 0 &&
			img.token == address(0)
		) {
			return false;
		}

		bool valid;

		if (img.token == dev) {
			// Validate the staking position.
			valid = img.requiredTokenAmount <= _positions.amount;
		} else {
			// Always only allow staking via the SwapAndStake contract.
			ISwapAndStake.Amounts memory stakeVia = swapAndStake.gatewayOf(
				img.gateway
			);

			// Validate the staking position.
			valid =
				img.requiredTokenAmount <= stakeVia.input &&
				img.requiredTokenFee <= stakeVia.fee &&
				allowlistedTokens[img.token] && // Ensure other contract are using allowlisted tokens.
				img.token == stakeVia.token; // Validate that token used is same as expected token.
		}

		if (valid) {
			stakedAmountAtMinted[_positions.property][id] = _positions.amount;
		}

		return valid;
	}
}
