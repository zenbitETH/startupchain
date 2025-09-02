// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./interfaces/IENS.sol";

contract StartupChain {
    struct Company {
        uint256 id;
        address companyAddress;
        string ensName;
        uint256 creationDate;
        address[] founders;
    }

    uint256 private nextCompanyId = 1;
    mapping(uint256 => Company) public companies;
    mapping(address => uint256) public addressToCompanyId;
    mapping(string => uint256) public ensNameToCompanyId;
    
    IENS public immutable ensRegistry;
    IENSRegistrar public immutable ensRegistrar;
    IENSResolver public immutable ensResolver;
    
    event CompanyRegistered(
        uint256 indexed companyId,
        address indexed companyAddress,
        string ensName,
        uint256 creationDate,
        address[] founders
    );
    
    event ENSTransferred(
        uint256 indexed companyId,
        string ensName,
        address indexed from,
        address indexed to
    );
    
    constructor(
        address _ensRegistry,
        address _ensRegistrar,
        address _ensResolver
    ) {
        ensRegistry = IENS(_ensRegistry);
        ensRegistrar = IENSRegistrar(_ensRegistrar);
        ensResolver = IENSResolver(_ensResolver);
    }
    
    function registerCompany(
        string memory _ensName,
        address[] memory _founders
    ) external returns (uint256) {
        require(_founders.length > 0, "At least one founder required");
        require(bytes(_ensName).length > 0, "ENS name required");
        require(addressToCompanyId[msg.sender] == 0, "Company already registered for this address");
        require(ensNameToCompanyId[_ensName] == 0, "ENS name already taken");
        
        for (uint i = 0; i < _founders.length; i++) {
            require(_founders[i] != address(0), "Invalid founder address");
        }
        
        bytes32 label = keccak256(bytes(_ensName));
        require(ensRegistrar.available(label), "ENS name not available");
        
        ensRegistrar.register(label, msg.sender);
        
        bytes32 node = keccak256(abi.encodePacked(bytes32(0), label));
        ensResolver.setAddr(node, msg.sender);
        
        uint256 companyId = nextCompanyId++;
        
        Company storage newCompany = companies[companyId];
        newCompany.id = companyId;
        newCompany.companyAddress = msg.sender;
        newCompany.ensName = _ensName;
        newCompany.creationDate = block.timestamp;
        newCompany.founders = _founders;
        
        addressToCompanyId[msg.sender] = companyId;
        ensNameToCompanyId[_ensName] = companyId;
        
        emit CompanyRegistered(
            companyId,
            msg.sender,
            _ensName,
            block.timestamp,
            _founders
        );
        
        return companyId;
    }
    
    function transferENS(uint256 _companyId, address _newOwner) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only company owner can transfer ENS");
        require(_newOwner != address(0), "Invalid new owner address");
        
        Company storage company = companies[_companyId];
        string memory ensName = company.ensName;
        bytes32 label = keccak256(bytes(ensName));
        bytes32 node = keccak256(abi.encodePacked(bytes32(0), label));
        
        ensRegistry.setOwner(node, _newOwner);
        ensResolver.setAddr(node, _newOwner);
        
        addressToCompanyId[msg.sender] = 0;
        addressToCompanyId[_newOwner] = _companyId;
        company.companyAddress = _newOwner;
        
        emit ENSTransferred(_companyId, ensName, msg.sender, _newOwner);
    }
    
    function getCompany(uint256 _companyId) external view returns (
        uint256 id,
        address companyAddress,
        string memory ensName,
        uint256 creationDate,
        address[] memory founders
    ) {
        require(companies[_companyId].id != 0, "Company does not exist");
        Company storage company = companies[_companyId];
        return (
            company.id,
            company.companyAddress,
            company.ensName,
            company.creationDate,
            company.founders
        );
    }
    
    function getCompanyByAddress(address _address) external view returns (
        uint256 id,
        address companyAddress,
        string memory ensName,
        uint256 creationDate,
        address[] memory founders
    ) {
        uint256 companyId = addressToCompanyId[_address];
        require(companyId != 0, "No company found for this address");
        Company storage company = companies[companyId];
        return (
            company.id,
            company.companyAddress,
            company.ensName,
            company.creationDate,
            company.founders
        );
    }
    
    function getCompanyByENS(string memory _ensName) external view returns (
        uint256 id,
        address companyAddress,
        string memory ensName,
        uint256 creationDate,
        address[] memory founders
    ) {
        uint256 companyId = ensNameToCompanyId[_ensName];
        require(companyId != 0, "No company found for this ENS name");
        Company storage company = companies[companyId];
        return (
            company.id,
            company.companyAddress,
            company.ensName,
            company.creationDate,
            company.founders
        );
    }
    
    function getCompanyFounders(uint256 _companyId) external view returns (address[] memory) {
        require(companies[_companyId].id != 0, "Company does not exist");
        return companies[_companyId].founders;
    }
    
    function getTotalCompanies() external view returns (uint256) {
        return nextCompanyId - 1;
    }
}