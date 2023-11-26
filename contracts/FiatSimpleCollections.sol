// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IProperty.sol";
import "./interfaces/ISwapAndStake.sol";
import "./interfaces/IPriceOracle.sol";

import {IUniswapV2Pair} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

/**
 * @title FiatSimpleCollections
 * @notice Intended to be used validating Matic input to target fiat (ie JPY) depending on price oracle
 */
contract FiatSimpleCollections is ITokenURIDescriptor, OwnableUpgradeable {
	struct Image {
		string src;
		string name;
		string description;
		uint256 requiredFiatAmount;
		uint256 requiredFiatFee;
		address gateway;
	}

	struct UsdAmount {
		uint256 amount;
		uint256 fee;
	}

	address public uniswapPair;

	ISwapAndStake public swapAndStake;

	address public fiatOracle;

	mapping(address => mapping(bytes32 => Image)) public propertyImages;
	mapping(address => mapping(uint256 => uint256)) public stakedAmountAtMinted;

	function initialize(
		address _contract,
		address _uniswapPair,
		address _fiatOracle
	) external initializer {
		__Ownable_init();
		swapAndStake = ISwapAndStake(_contract);
		uniswapPair = _uniswapPair;
		fiatOracle = _fiatOracle;
	}

	modifier onlyPropertyAuthor(address _property) {
		address author = IProperty(_property).author();
		require(author == _msgSender(), "illegal access");
		_;
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

	function getNativePriceInUsdc() internal view returns (uint256) {
		IUniswapV2Pair pair = IUniswapV2Pair(uniswapPair);

		(uint112 reserve0, uint112 reserve1, ) = pair.getReserves();
		(uint112 reserveMatic, uint112 reserveUsdc) = pair.token0() ==
			address(0x0)
			? (reserve0, reserve1)
			: (reserve1, reserve0);

		return (reserveUsdc * 1e18) / reserveMatic;
	}

	/**
	 * @dev Matic/Target Fiat price (ie JPY)
	 * @return uint256
	 */
	function nativeToFiat() external view returns (uint256) {
		// get the price of ETH/Matic in USD
		uint256 nativePriceUsd = getNativePriceInUsdc();

		// Check fiat value vs USD (ie JPY/USD)
		uint256 fiatCurrencyToUsd = uint256(
			IPriceOracle(fiatOracle).latestAnswer() * 1e10
		);

		return (nativePriceUsd * 1e18) / fiatCurrencyToUsd;
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
			img.requiredFiatFee == 0
		) {
			return false;
		}

		// Always only allow staking via the SwapAndStake contract.
		ISwapAndStake.Amounts memory stakeVia = swapAndStake.gatewayOf(
			img.gateway
		);

		uint256 maticPrice = getNativePriceInUsdc();

		// calculate stake amount in USD
		UsdAmount memory stakeViaUsd = UsdAmount({
			amount: (stakeVia.input * maticPrice) / 1e18,
			fee: (stakeVia.fee * maticPrice) / 1e18
		});

		// Check fiat value vs USD
		uint256 currencyToUsd = uint256(
			IPriceOracle(fiatOracle).latestAnswer() * 1e10
		);

		uint256 stakeInputTargetFiat = (stakeViaUsd.amount / currencyToUsd) *
			1e18;
		uint256 stakeFeeTargetFiat = (stakeViaUsd.fee / currencyToUsd) * 1e18;

		// Validate the staking position.
		bool valid = img.requiredFiatAmount <= stakeInputTargetFiat &&
			img.requiredFiatFee <= stakeFeeTargetFiat;

		if (valid) {
			stakedAmountAtMinted[_positions.property][id] = _positions.amount;
		}

		return valid;
	}
}
