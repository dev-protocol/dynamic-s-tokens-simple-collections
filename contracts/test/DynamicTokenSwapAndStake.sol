// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "../interfaces/IDynamicTokenSwapAndStake.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";

contract DynamicTokenSwapAndStake {
	address public target;
	mapping(address => IDynamicTokenSwapAndStake.Amounts) public gatewayOf;

	constructor(address _addr) {
		target = _addr;
	}

	function __mock(
		uint256 _id,
		address gateway,
		IDynamicTokenSwapAndStake.Amounts memory _amounts,
		ISTokensManagerStruct.StakingPositions memory _positions,
		bytes32 _key
	) external returns (bool) {
		gatewayOf[gateway] = _amounts;
		bool res = ITokenURIDescriptor(target).onBeforeMint(
			_id,
			msg.sender,
			_positions,
			_key
		);

		delete gatewayOf[gateway];

		return res;
	}
}
