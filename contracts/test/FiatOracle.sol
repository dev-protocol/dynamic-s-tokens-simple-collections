// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

contract MockFiatOracle is IPriceOracle {
	constructor() {}

	function latestAnswer() external view returns (int256) {
		return 690481;
	}

	function latestRoundData()
		external
		view
		returns (
			uint80 roundId,
			int256 answer,
			uint256 startedAt,
			uint256 updatedAt,
			uint80 answeredInRound
		)
	{
		return (
			36893488147419105322,
			690481,
			1688046456,
			1688046456,
			36893488147419105322
		);
	}
}
