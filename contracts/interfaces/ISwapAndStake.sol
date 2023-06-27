// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity 0.8.9;

interface ISwapAndStake {
	struct Amounts {
		uint256 input;
		uint256 fee;
		address token;
	}

	function gatewayOf(address _addr) external view returns (Amounts memory);
}
