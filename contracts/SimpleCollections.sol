// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IProperty.sol";
import "./interfaces/ISwapAndStake.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";

contract SimpleCollections is ITokenURIDescriptor, OwnableUpgradeable {
	struct Image {
		string src;
		string name;
		string description;
		uint256 requiredETHAmount;
		uint256 requiredETHFee;
		address gateway;
	}

	ISwapAndStake public swapAndStake;
	mapping(address => mapping(bytes32 => Image)) public propertyImages;
	mapping(address => mapping(uint256 => uint256)) public stakedAmountAtMinted;

	uint32 public lookbackSec = 300; // 5 minutes
	address public devEthUniV3Pool;

	function initialize(address _contract) external initializer {
		__Ownable_init();
		swapAndStake = ISwapAndStake(_contract);
	}

	modifier onlyPropertyAuthor(address _property) {
		address author = IProperty(_property).author();
		require(author == _msgSender(), "illegal access");
		_;
	}

	function setSwapAndStake(address _contract) external onlyOwner {
		swapAndStake = ISwapAndStake(_contract);
	}

	function setDevEthUniV3Pool(address _pool) external onlyOwner {
		devEthUniV3Pool = _pool;
	}

	function setLookbackSec(uint32 _lookbackSec) external onlyOwner {
		lookbackSec = _lookbackSec;
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
			img.requiredETHAmount == 0 &&
			img.requiredETHFee == 0
		) {
			return false;
		}

		// Validate the staking position.
		bool valid = false;

		// `requiredETHFee` will be 0 when using direct `DEV` otherwise it's assumed
		// that input currency is `ETH`.
		if (img.requiredETHFee > 0) {
			// This condition validates input user ETH and fee.
			// Always only allow staking via the SwapAndStake contract.
			ISwapAndStake.Amounts memory stakeVia = swapAndStake.gatewayOf(
				img.gateway
			);

			valid =
				img.requiredETHAmount <= stakeVia.input &&
				img.requiredETHFee <= stakeVia.fee;
		} else {
			// This condition validates input `DEV` equivalent `ETH` with required.

			// Get the average price tick first
			(int24 arithmeticMeanTick, ) = OracleLibrary.consult(
				devEthUniV3Pool,
				lookbackSec
			);

			// Get the quote for selling `DEV staked`. Assumes 1e18 for both.
			// Fetch the `amount of ETH` the `DEV staked` is equal to.
			uint256 equivalentETHStaked = OracleLibrary.getQuoteAtTick(
				arithmeticMeanTick,
				_positions.amount,
				swapAndStake.devAddress(), // Fetch the `DEV token address` for this chain and setting from swapAndStake.
				swapAndStake.wethAddress() // Fetch the `WETH token address` for this chain and setting from swapAndStake.
			);

			valid = img.requiredETHAmount <= equivalentETHStaked;
		}

		if (valid) {
			stakedAmountAtMinted[_positions.property][id] = _positions.amount;
		}

		return valid;
	}
}
