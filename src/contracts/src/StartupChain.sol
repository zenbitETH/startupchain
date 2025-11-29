// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./interfaces/IENS.sol";

contract StartupChain {
    // Founder with equity allocation (basis points, 10000 = 100%)
    struct Founder {
        address wallet;
        uint256 equityBps; // Equity in basis points (e.g., 5000 = 50%)
        string role; // Optional role: "CEO", "CTO", etc.
    }

    struct Company {
        uint256 id;
        address companyAddress; // Safe address (ENS owner)
        string ensName;
        uint256 creationDate;
        address safeAddress; // Gnosis Safe multisig address
        address governanceAddress; // GovernanceWrapper contract address
        uint256 threshold; // Safe signing threshold
    }

    struct Subdomain {
        string name;
        address owner;
        uint256 createdAt;
        bool active;
    }

    // Fee configuration (25% = 2500 basis points)
    uint256 public constant SERVICE_FEE_BPS = 2500;
    uint256 public constant BPS_DENOMINATOR = 10000;
    address public feeRecipient;
    address public owner;

    uint256 private nextCompanyId = 1;
    mapping(uint256 => Company) public companies;
    mapping(address => uint256) public addressToCompanyId; // Safe address => companyId
    mapping(string => uint256) public ensNameToCompanyId;
    
    // Cap table: companyId => founder index => Founder
    mapping(uint256 => Founder[]) public companyFounders;

    // Subdomain mappings: companyId => subdomain name => Subdomain
    mapping(uint256 => mapping(string => Subdomain)) public subdomains;
    mapping(uint256 => string[]) public companySubdomains;
    
    IENS public immutable ensRegistry;
    IENSRegistrar public immutable ensRegistrar;
    IENSResolver public immutable ensResolver;

    // Events
    event CompanyRegistered(
        uint256 indexed companyId,
        address indexed safeAddress,
        string ensName,
        uint256 creationDate,
        uint256 threshold
    );

    event FoundersSet(
        uint256 indexed companyId,
        address[] wallets,
        uint256[] equityBps,
        string[] roles
    );

    event OwnersUpdated(
        uint256 indexed companyId,
        uint256 threshold,
        address[] owners
    );

    event ThresholdUpdated(
        uint256 indexed companyId,
        uint256 oldThreshold,
        uint256 newThreshold
    );

    event SafeLinked(
        uint256 indexed companyId,
        address indexed safeAddress,
        uint256 threshold
    );

    event MetadataUpdated(
        uint256 indexed companyId,
        string key,
        string value
    );

    event FeeCollected(
        uint256 indexed companyId,
        uint256 amount,
        address indexed recipient
    );

    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );

    event ENSTransferred(
        uint256 indexed companyId,
        string ensName,
        address indexed from,
        address indexed to
    );

    event SubdomainCreated(
        uint256 indexed companyId,
        string subdomain,
        address indexed owner,
        uint256 createdAt
    );

    event SubdomainRevoked(
        uint256 indexed companyId,
        string subdomain,
        address indexed previousOwner
    );

    event SafeAddressSet(
        uint256 indexed companyId,
        address indexed safeAddress
    );

    event GovernanceAddressSet(
        uint256 indexed companyId,
        address indexed governanceAddress
    );
    
    constructor(
        address _ensRegistry,
        address _ensRegistrar,
        address _ensResolver,
        address _feeRecipient
    ) {
        ensRegistry = IENS(_ensRegistry);
        ensRegistrar = IENSRegistrar(_ensRegistrar);
        ensResolver = IENSResolver(_ensResolver);
        feeRecipient = _feeRecipient;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    /// @notice Register a new company with Safe as ENS owner
    /// @param _ensName The ENS name to register (without .eth)
    /// @param _safeAddress The Safe multisig that will own the ENS
    /// @param _founders Array of founder data (wallet, equityBps, role)
    /// @param _threshold The Safe signing threshold
    function registerCompany(
        string memory _ensName,
        address _safeAddress,
        Founder[] memory _founders,
        uint256 _threshold
    ) external payable returns (uint256) {
        require(_founders.length > 0, "At least one founder required");
        require(bytes(_ensName).length > 0, "ENS name required");
        require(_safeAddress != address(0), "Invalid Safe address");
        require(addressToCompanyId[_safeAddress] == 0, "Company already registered for this Safe");
        require(ensNameToCompanyId[_ensName] == 0, "ENS name already taken");
        require(_threshold > 0 && _threshold <= _founders.length, "Invalid threshold");

        // Validate founders and equity totals
        uint256 totalEquity = 0;
        for (uint i = 0; i < _founders.length; i++) {
            require(_founders[i].wallet != address(0), "Invalid founder address");
            require(_founders[i].equityBps <= BPS_DENOMINATOR, "Invalid equity amount");
            totalEquity += _founders[i].equityBps;
        }
        require(totalEquity <= BPS_DENOMINATOR, "Total equity exceeds 100%");

        // Collect service fee
        uint256 fee = (msg.value * SERVICE_FEE_BPS) / BPS_DENOMINATOR;
        if (fee > 0 && feeRecipient != address(0)) {
            (bool sent, ) = feeRecipient.call{value: fee}("");
            require(sent, "Fee transfer failed");
        }
        
        bytes32 label = keccak256(bytes(_ensName));
        require(ensRegistrar.available(label), "ENS name not available");
        
        // Register ENS with Safe as owner
        ensRegistrar.register(label, _safeAddress);
        
        bytes32 node = keccak256(abi.encodePacked(bytes32(0), label));
        ensResolver.setAddr(node, _safeAddress);
        
        uint256 companyId = nextCompanyId++;
        
        Company storage newCompany = companies[companyId];
        newCompany.id = companyId;
        newCompany.companyAddress = _safeAddress;
        newCompany.ensName = _ensName;
        newCompany.creationDate = block.timestamp;
        newCompany.safeAddress = _safeAddress;
        newCompany.threshold = _threshold;
        
        // Store founders in cap table
        for (uint i = 0; i < _founders.length; i++) {
            companyFounders[companyId].push(_founders[i]);
        }
        
        addressToCompanyId[_safeAddress] = companyId;
        ensNameToCompanyId[_ensName] = companyId;

        // Emit events
        emit CompanyRegistered(
            companyId,
            _safeAddress,
            _ensName,
            block.timestamp,
            _threshold
        );

        emit SafeLinked(companyId, _safeAddress, _threshold);

        if (fee > 0) {
            emit FeeCollected(companyId, fee, feeRecipient);
        }

        // Emit founders data
        address[] memory wallets = new address[](_founders.length);
        uint256[] memory equities = new uint256[](_founders.length);
        string[] memory roles = new string[](_founders.length);
        for (uint i = 0; i < _founders.length; i++) {
            wallets[i] = _founders[i].wallet;
            equities[i] = _founders[i].equityBps;
            roles[i] = _founders[i].role;
        }
        emit FoundersSet(companyId, wallets, equities, roles);
        
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
        address safeAddress,
        uint256 threshold
    ) {
        require(companies[_companyId].id != 0, "Company does not exist");
        Company storage company = companies[_companyId];
        return (
            company.id,
            company.companyAddress,
            company.ensName,
            company.creationDate,
            company.safeAddress,
            company.threshold
        );
    }
    
    function getCompanyByAddress(address _address) external view returns (
        uint256 id,
        address companyAddress,
        string memory ensName,
        uint256 creationDate,
        address safeAddress,
        uint256 threshold
    ) {
        uint256 companyId = addressToCompanyId[_address];
        require(companyId != 0, "No company found for this address");
        Company storage company = companies[companyId];
        return (
            company.id,
            company.companyAddress,
            company.ensName,
            company.creationDate,
            company.safeAddress,
            company.threshold
        );
    }
    
    function getCompanyByENS(string memory _ensName) external view returns (
        uint256 id,
        address companyAddress,
        string memory ensName,
        uint256 creationDate,
        address safeAddress,
        uint256 threshold
    ) {
        uint256 companyId = ensNameToCompanyId[_ensName];
        require(companyId != 0, "No company found for this ENS name");
        Company storage company = companies[companyId];
        return (
            company.id,
            company.companyAddress,
            company.ensName,
            company.creationDate,
            company.safeAddress,
            company.threshold
        );
    }
    
    /// @notice Get all founders with equity for a company
    function getCompanyFounders(uint256 _companyId) external view returns (Founder[] memory) {
        require(companies[_companyId].id != 0, "Company does not exist");
        return companyFounders[_companyId];
    }

    /// @notice Get founder addresses only (for backward compatibility)
    function getCompanyFounderAddresses(uint256 _companyId) external view returns (address[] memory) {
        require(companies[_companyId].id != 0, "Company does not exist");
        Founder[] storage founders = companyFounders[_companyId];
        address[] memory addresses = new address[](founders.length);
        for (uint i = 0; i < founders.length; i++) {
            addresses[i] = founders[i].wallet;
        }
        return addresses;
    }
    
    function getTotalCompanies() external view returns (uint256) {
        return nextCompanyId - 1;
    }

    // Subdomain Management Functions
    function createSubdomain(
        uint256 _companyId,
        string memory _subdomain,
        address _owner
    ) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only company owner can create subdomains");
        require(_owner != address(0), "Invalid owner address");
        require(bytes(_subdomain).length > 0, "Subdomain name required");
        require(!subdomains[_companyId][_subdomain].active, "Subdomain already exists");

        Company storage company = companies[_companyId];
        bytes32 companyNode = keccak256(abi.encodePacked(bytes32(0), keccak256(bytes(company.ensName))));
        bytes32 subdomainLabel = keccak256(bytes(_subdomain));

        // Create subdomain in ENS
        ensRegistry.setSubnodeOwner(companyNode, subdomainLabel, _owner);

        // Set resolver for subdomain
        bytes32 subdomainNode = keccak256(abi.encodePacked(companyNode, subdomainLabel));
        ensResolver.setAddr(subdomainNode, _owner);

        // Store subdomain data
        subdomains[_companyId][_subdomain] = Subdomain({
            name: _subdomain,
            owner: _owner,
            createdAt: block.timestamp,
            active: true
        });

        companySubdomains[_companyId].push(_subdomain);

        emit SubdomainCreated(_companyId, _subdomain, _owner, block.timestamp);
    }

    function revokeSubdomain(uint256 _companyId, string memory _subdomain) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only company owner can revoke subdomains");
        require(subdomains[_companyId][_subdomain].active, "Subdomain does not exist or already revoked");

        Subdomain storage subdomain = subdomains[_companyId][_subdomain];
        address previousOwner = subdomain.owner;

        Company storage company = companies[_companyId];
        bytes32 companyNode = keccak256(abi.encodePacked(bytes32(0), keccak256(bytes(company.ensName))));
        bytes32 subdomainLabel = keccak256(bytes(_subdomain));

        // Revoke subdomain in ENS by setting owner to zero address
        ensRegistry.setSubnodeOwner(companyNode, subdomainLabel, address(0));

        subdomain.active = false;

        emit SubdomainRevoked(_companyId, _subdomain, previousOwner);
    }

    function getSubdomain(uint256 _companyId, string memory _subdomain) external view returns (
        string memory name,
        address subdomainOwner,
        uint256 createdAt,
        bool active
    ) {
        require(companies[_companyId].id != 0, "Company does not exist");
        Subdomain storage subdomain = subdomains[_companyId][_subdomain];
        return (subdomain.name, subdomain.owner, subdomain.createdAt, subdomain.active);
    }

    function getCompanySubdomains(uint256 _companyId) external view returns (string[] memory) {
        require(companies[_companyId].id != 0, "Company does not exist");
        return companySubdomains[_companyId];
    }

    // Safe and Governance Integration
    function setSafeAddress(uint256 _companyId, address _safeAddress) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only company owner can set Safe address");
        require(_safeAddress != address(0), "Invalid Safe address");

        companies[_companyId].safeAddress = _safeAddress;

        emit SafeAddressSet(_companyId, _safeAddress);
    }

    function setGovernanceAddress(uint256 _companyId, address _governanceAddress) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only company owner can set governance address");
        require(_governanceAddress != address(0), "Invalid governance address");

        companies[_companyId].governanceAddress = _governanceAddress;

        emit GovernanceAddressSet(_companyId, _governanceAddress);
    }

    function getSafeAddress(uint256 _companyId) external view returns (address) {
        require(companies[_companyId].id != 0, "Company does not exist");
        return companies[_companyId].safeAddress;
    }

    function getGovernanceAddress(uint256 _companyId) external view returns (address) {
        require(companies[_companyId].id != 0, "Company does not exist");
        return companies[_companyId].governanceAddress;
    }

    function getThreshold(uint256 _companyId) external view returns (uint256) {
        require(companies[_companyId].id != 0, "Company does not exist");
        return companies[_companyId].threshold;
    }

    /// @notice Update threshold (called when Safe threshold changes)
    function updateThreshold(uint256 _companyId, uint256 _newThreshold) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only Safe can update threshold");
        require(_newThreshold > 0, "Invalid threshold");

        uint256 oldThreshold = companies[_companyId].threshold;
        companies[_companyId].threshold = _newThreshold;

        emit ThresholdUpdated(_companyId, oldThreshold, _newThreshold);
    }

    /// @notice Update founders/owners (called when Safe owners change)
    function updateFounders(uint256 _companyId, Founder[] memory _founders) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only Safe can update founders");
        require(_founders.length > 0, "At least one founder required");

        // Validate equity totals
        uint256 totalEquity = 0;
        for (uint i = 0; i < _founders.length; i++) {
            require(_founders[i].wallet != address(0), "Invalid founder address");
            totalEquity += _founders[i].equityBps;
        }
        require(totalEquity <= BPS_DENOMINATOR, "Total equity exceeds 100%");

        // Clear existing founders
        delete companyFounders[_companyId];

        // Add new founders
        for (uint i = 0; i < _founders.length; i++) {
            companyFounders[_companyId].push(_founders[i]);
        }

        // Emit events
        address[] memory wallets = new address[](_founders.length);
        uint256[] memory equities = new uint256[](_founders.length);
        string[] memory roles = new string[](_founders.length);
        for (uint i = 0; i < _founders.length; i++) {
            wallets[i] = _founders[i].wallet;
            equities[i] = _founders[i].equityBps;
            roles[i] = _founders[i].role;
        }
        emit FoundersSet(_companyId, wallets, equities, roles);
        emit OwnersUpdated(_companyId, companies[_companyId].threshold, wallets);
    }

    /// @notice Update fee recipient (owner only)
    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    /// @notice Transfer contract ownership
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner");
        owner = _newOwner;
    }

    /// @notice Calculate service fee for a given amount
    function calculateFee(uint256 _amount) external pure returns (uint256) {
        return (_amount * SERVICE_FEE_BPS) / BPS_DENOMINATOR;
    }

    /// @notice Withdraw any stuck ETH (owner only)
    function withdraw() external onlyOwner {
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }

    receive() external payable {}
}