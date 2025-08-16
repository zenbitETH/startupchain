// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StartUpSharesContract is ERC20 {
    address public owner;
    uint public value;

    constructor(uint _initialSupply) ERC20("BensonSoft", "BENS") { 
       owner = msg.sender;
	_mint(msg.sender, _initialSupply * 10 ** decimals()); 
       value = _initialSupply;
    }

    function updateValue(uint _newValue) public {
        require(msg.sender == owner, "Only owner can update value");
        value = _newValue;
    }
}
