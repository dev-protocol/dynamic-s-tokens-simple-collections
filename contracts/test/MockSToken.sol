// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "../interfaces/ISwapAndStake.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";

contract MockSToken {
	address public target;

	constructor(address _addr) {
		target = _addr;
	}

	function __mock(
		uint256 _id,
		ISTokensManagerStruct.StakingPositions memory _positions,
		bytes32 _key
	) external returns (bool) {
		bool res = ITokenURIDescriptor(target).onBeforeMint(
			_id,
			msg.sender,
			_positions,
			_key
		);

		return res;
	}
}
