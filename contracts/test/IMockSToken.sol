// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;

import "../interfaces/ISwapAndStake.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ITokenURIDescriptor.sol";
import "@devprotocol/i-s-tokens/contracts/interfaces/ISTokensManagerStruct.sol";

interface IMockSToken {
	function __mock(
		uint256 _id,
		ISTokensManagerStruct.StakingPositions memory _positions,
		bytes32 _key
	) external returns (bool);
}
