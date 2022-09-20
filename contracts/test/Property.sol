// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.9;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Property is ERC20 {
	uint8 private constant PROPERTY_DECIMALS = 18;
	uint256 private constant SUPPLY = 10000000000000000000000000;
	address private __author;
	string private __name;
	string private __symbol;
	uint8 private __decimals;

	constructor(
        address _own,
		string memory _name,
		string memory _symbol
    ) ERC20(_name, _symbol) {
        /**
		 * Sets the author.
		 */
		__author = _own;

		/**
		 * Sets the ERO20 attributes
		 */
		__decimals = PROPERTY_DECIMALS;
        _mint(__author, 9500000000000000000000000);
    }

	/**
	 * @dev Throws if called by any account other than the author.
	 */
	modifier onlyAuthor() {
		require(msg.sender == __author, "illegal sender");
		_;
	}

	/**
	 * @dev Returns the name of the author.
	 * @return The the author address.
	 */
	function author() external view returns (address) {
		return __author;
	}
}