// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "../interfaces/ISwapAndStake.sol";

contract SwapAndStake {
	mapping(address => ISwapAndStake.Amounts) public gatewayOf;

	function __setGatewayOf(
		address gateway,
		ISwapAndStake.Amounts memory _amounts
	) external {
		gatewayOf[gateway] = _amounts;
	}
}
