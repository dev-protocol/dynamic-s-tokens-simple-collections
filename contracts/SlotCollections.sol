// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IProperty.sol";
import "./interfaces/ISwapAndStake.sol";

contract SlotCollections is ITokenURIDescriptor, OwnableUpgradeable {
	struct Image {
		string src;
		string name;
		string description;
		uint256 deadline;
		uint32 members;
		uint256 requiredTokenAmount;
		uint256 requiredTokenFee;
		address token;
		address gateway;
	}

	ISwapAndStake public swapAndStake;
	mapping(address => mapping(bytes32 => Image)) public propertyImages;
	mapping(address => mapping(uint256 => uint256)) public stakedAmountAtMinted;
	mapping(address => mapping(bytes32 => uint32))
		public propertyImageClaimedSlots;
	mapping(address => bool) public allowlistedTokens;
	address public dev;

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
		require(_images.length == _keys.length, "Array length mismatch");
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

	function isValidImage(
		Image memory img,
		bytes32 key,
		address property
	) private view returns (bool) {
		return
			(
				// If deadline is set, validates it.
				img.deadline > 0
				// solhint-disable-next-line not-rely-on-time
				? img.deadline > block.timestamp
				: true
			)
			&&
			(
				// If members is set, validates it.
				img.members > 0
				? img.members > propertyImageClaimedSlots[property][key]
				: true
			)
			&&
			(
				img.deadline > 0 || img.members > 0
			)
			&&
			bytes(img.src).length != 0;
	}

	function isValidStake(
		Image memory img,
		ISwapAndStake.Amounts memory stakeVia
	) private pure returns (bool) {
		return
			img.requiredTokenAmount <= stakeVia.input &&
			img.requiredTokenFee <= stakeVia.fee &&
			img.token == stakeVia.token;
	}

	function onBeforeMint(
		uint256 id,
		address,
		ISTokensManagerStruct.StakingPositions memory _positions,
		bytes32 key
	) external returns (bool) {
		Image memory img = propertyImages[_positions.property][key];

		if (!isValidImage(img, key, _positions.property)) {
			return false;
		}
		// Always only allow staking via the SwapAndStake contract.
		ISwapAndStake.Amounts memory stakeVia = swapAndStake.gatewayOf(
			img.gateway
		);

		// Validate the staking position.
		bool validStake = isValidStake(img, stakeVia);
		if (validStake) {
			stakedAmountAtMinted[_positions.property][id] = _positions.amount;
			if (img.members != 0) {
				propertyImageClaimedSlots[_positions.property][key]++;
			}
		}

		return validStake;
	}

	// get time left
	function getTimeLeft(
		address _property,
		bytes32 _key
	) external view returns (uint256) {
		Image memory img = propertyImages[_property][_key];
		if (img.deadline == 0) {
			return 0;
		}
		// solhint-disable-next-line not-rely-on-time
		if (img.deadline < block.timestamp) {
			return 0;
		}
		// solhint-disable-next-line not-rely-on-time
		return img.deadline - block.timestamp;
	}

	function getSlotsLeft(
		address _property,
		bytes32 _key
	) external view returns (uint256) {
		Image memory img = propertyImages[_property][_key];
		if (
			img.members == 0 ||
			img.members == propertyImageClaimedSlots[_property][_key]
		) {
			return 0;
		}
		return img.members - propertyImageClaimedSlots[_property][_key];
	}
}
