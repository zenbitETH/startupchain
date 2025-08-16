// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./StartUpSharesContract.sol"; 

contract StartUpChain {
    /// @dev this is the contract owner.
    address public owner; 

    // Mapping to store addresses of deployed contracts
    address[] public deployedContracts;

    string public companyName;
    uint public numberOfShares;
    uint public percentFoundersOwnership; // public remaining percentage.

    uint8 public numberOfFounders;

    struct Founder {
	string name;
	string title;
	uint percentOwnership;
    }

    Founder[] public founders;

    /// @dev modifier to check if the caller is the owner.
    modifier isOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    /// @dev initialize the contract; set the contract's owner.
    constructor () {
        owner = msg.sender;
    }

    /**
     * @notice register your company by creating an ENS name.
     * @param _companyName name of new company.
     */
    function registerCompany(string memory _companyName) external isOwner {
        companyName  = _companyName;
    } 

    /**
     * @notice set the number of shares.
     * @param _numberOfShares number of shares.
     */
    function setNumberOfShares(uint _numberOfShares) external isOwner {
        numberOfShares = _numberOfShares;
    } 

    /**
     * @notice set founders.
     * @param _name founder's name.
     * @param _title founder's title.
     * @param _percentOwnership founder's ownership as a percent.
     */
    function addFounder(string memory _name, string memory _title, uint _percentOwnership) external isOwner {
        founders.push(Founder(_name, _title, _percentOwnership));
	numberOfFounders++;
    } 

    // for testing the array's length.
    function getFounderCount() public returns (uint) {
        return founders.length;
    } 

    /**
     * @notice set the number of shares.
     * @param _percentFoundersOwnership.
     */
    function setFoundersOwnership(uint _percentFoundersOwnership) external isOwner {
        percentFoundersOwnership = _percentFoundersOwnership; // the public owns the remaining percentage.
    } 

    // for testing the array's length.
    function getDeployedContractsCount() public returns (uint) {
        return deployedContracts.length;
    } 

    // Deploy a new instance of StartUpSharesContract
    function createStartUpSharesContract(uint _initialValue) public returns (address) {
        StartUpSharesContract newStartUpSharesContract = new StartUpSharesContract(_initialValue);

        // Store the address of the newly deployed contract
        deployedContracts.push(address(newStartUpSharesContract));

        return address(newStartUpSharesContract);
    }
}
