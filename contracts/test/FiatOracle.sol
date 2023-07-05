// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

contract MockFiatOracle is IPriceOracle {
	constructor() {}

	function latestAnswer() external view returns (int256) {
		return 700000;
	}
}
