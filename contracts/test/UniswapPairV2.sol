// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

contract MockUniswapPool {
	IERC20 public token0;
	IERC20 public token1;
	uint112 public reserve0;
	uint112 public reserve1;

	constructor(IERC20 _token0, IERC20 _token1) {
		token0 = _token0;
		token1 = _token1;
	}

	function initialize(uint112 _reserve0, uint112 _reserve1) external {
		reserve0 = _reserve0;
		reserve1 = _reserve1;
	}

	function addLiquidity(uint112 amount0, uint112 amount1) external {
		require(
			amount0 > 0 && amount1 > 0,
			"Amounts must be greater than zero"
		);

		token0.transferFrom(msg.sender, address(this), amount0);
		token1.transferFrom(msg.sender, address(this), amount1);

		reserve0 += amount0;
		reserve1 += amount1;
	}

	function getReserves() external view returns (uint112, uint112, uint32) {
		return (reserve0, reserve1, uint32(block.timestamp));
	}

	function getToken0Mock() external view returns (address) {
		return address(token0);
	}

	function getToken1Mock() external view returns (address) {
		return address(token1);
	}
}
