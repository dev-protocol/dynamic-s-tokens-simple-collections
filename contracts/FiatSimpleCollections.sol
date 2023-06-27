// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IProperty.sol";
import "./interfaces/ISwapAndStake.sol";
import "./interfaces/IPriceOracle.sol";

contract FiatSimpleCollections is ITokenURIDescriptor, OwnableUpgradeable {
	struct Image {
		string src;
		string name;
		string description;
		uint256 requiredFiatAmount;
		uint256 requiredFiatFee;
		address gateway;
		address token;
	}

	ISwapAndStake public swapAndStake;
	mapping(address => mapping(bytes32 => Image)) public propertyImages;
	mapping(address => mapping(uint256 => uint256)) public stakedAmountAtMinted;
	mapping(address => bool) public allowlistedTokens;

	// Maps the payment address to the price oracle address
	// These are set by the owner
	mapping(address => address) private tokenPriceOracle;

	function initialize(address _contract) external initializer {
		__Ownable_init();
		swapAndStake = ISwapAndStake(_contract);
	}

	modifier onlyPropertyAuthor(address _property) {
		address author = IProperty(_property).author();
		require(author == _msgSender(), "illegal access");
		_;
	}

/**
 * Allow owner to set the price oracle for a given token
 * @param _token being used for payment
 * @param _oracle address of the price oracle
 */
	function setTokenPriceOracle(address _token, address _oracle) external onlyOwner {
		tokenPriceOracle[_token] = _oracle;
	}

	function setSwapAndStake(address _contract) external onlyOwner {
		swapAndStake = ISwapAndStake(_contract);
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
			img.requiredFiatAmount == 0 &&
			img.requiredFiatFee == 0 &&
			img.token == address(0)
		) {
			return false;
		}

		// Always only allow staking via the SwapAndStake contract.
		ISwapAndStake.Amounts memory stakeVia = swapAndStake.gatewayOf(
			img.gateway
		);

		// Check currency value vs USD
		// int256 currencyToUsd = priceOracle.latestAnswer();
		uint256 currencyToUsd = uint256(IPriceOracle(tokenPriceOracle[img.token]).latestAnswer());

		// Calculate the required USD amount
		uint256 usdRequiredAmount = currencyToUsd * img.requiredFiatAmount;
		uint256 usdFeeAmount = currencyToUsd * img.requiredFiatFee;

		// should i be converting this USD amounts to Matic here?

		// Validate the staking position.
		bool valid = usdRequiredAmount <= stakeVia.input &&
			usdFeeAmount <= stakeVia.fee &&
			allowlistedTokens[img.token] && // Ensure other contract are using allowlisted tokens.
			img.token != address(0); // TODO: compare img.token with stakeVia.tooken coming from swapAndStake.

		if (valid) {
			stakedAmountAtMinted[_positions.property][id] = _positions.amount;
		}

		return valid;
	}
}
