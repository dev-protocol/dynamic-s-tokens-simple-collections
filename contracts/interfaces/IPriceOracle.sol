// SPDX-License-Identifier: MPL-2.0
// solhint-disable-next-line compiler-version
pragma solidity ^0.8.0;

// pulled from https://polygonscan.com/address/0xd647a6fc9bc6402301583c91decc5989d8bc382d#readContract
interface IPriceOracle {
	function latestAnswer() external view returns (int256); // returns 8 decimal places
}
