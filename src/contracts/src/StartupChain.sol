// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./interfaces/IENS.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Minimal Gnosis Safe interface — used to authorize `recordCompany` against real Safe control.
interface ISafe {
    function isOwner(address owner) external view returns (bool);
}

/// @title StartupChain
/// @notice Company (microDAO) registry. Hardened by the Zenbit security pass (mirrors the AxoloDAO
/// best-of-4 hardening patterns; this repo stays fully decoupled from axolodao-system):
///  - **#1** `recordCompany` now requires the caller to be an owner of the target Safe — closes the
///    `ensNameToCompanyId` squat / front-run vector (anyone could previously register any name/Safe).
///  - **#2** admin is `Ownable2Step` (2-step ownership; deploy the owner as a 2/3 Safe) and
///    `setFeeRecipient` is behind a timelock.
///  - **#3** `recordCompany` follows checks-effects-interactions and is `nonReentrant` (the fee `.call`
///    was previously executed before state writes).
///  - **#5** the `.eth` namehash is computed correctly (`namehash("eth")` as the parent, not the ENS
///    root) in `transferENS` / `createSubdomain` / `revokeSubdomain`.
///  - **#6** founder loops are bounded (`MAX_FOUNDERS`) and a `founder → companyId[]` index replaces the
///    off-chain O(n) full-registry scan; `isFounder` backs the AttestationModule membership check.
///
/// **Sepolia only.** No mainnet moves. Cap-table detail still lives in contract storage; moving it to a
/// permanent Arweave snapshot + EAS anchor is a separate, larger PR (see SECURITY notes, item #9).
contract StartupChain is Ownable2Step, ReentrancyGuard {
    struct Founder {
        address wallet;
        uint256 equityBps; // basis points (10000 = 100%)
        string role;
    }

    struct Company {
        uint256 id;
        address companyAddress; // Safe address (ENS owner)
        string ensName;
        uint256 creationDate;
        address safeAddress;
        address governanceAddress;
        uint256 threshold;
    }

    struct Subdomain {
        string name;
        address owner;
        uint256 createdAt;
        bool active;
    }

    uint256 public constant SERVICE_FEE_BPS = 2500;
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Bound on founders per company (#6 — prevents unbounded-loop gas DoS).
    uint256 public constant MAX_FOUNDERS = 50;

    /// @notice Timelock delay for the sensitive `setFeeRecipient` setter (#2).
    uint256 public constant FEE_RECIPIENT_TIMELOCK = 2 days;

    /// @notice namehash("eth") — the correct parent node for `<label>.eth` (#5).
    bytes32 private constant ETH_NODE = keccak256(abi.encodePacked(bytes32(0), keccak256("eth")));

    address public feeRecipient;

    // pending timelocked fee-recipient change (#2)
    address public pendingFeeRecipient;
    uint256 public pendingFeeRecipientEta;

    uint256 private nextCompanyId = 1;
    mapping(uint256 => Company) public companies;
    mapping(address => uint256) public addressToCompanyId; // Safe address => companyId
    mapping(string => uint256) public ensNameToCompanyId;

    mapping(uint256 => Founder[]) public companyFounders;

    /// @notice founder wallet => companyIds they have appeared in (#6 index; append-only — callers
    /// confirm current membership via `isFounder`/`getCompanyFounders`).
    mapping(address => uint256[]) private founderCompanies;

    mapping(uint256 => mapping(string => Subdomain)) public subdomains;
    mapping(uint256 => string[]) public companySubdomains;

    IENS public immutable ensRegistry;
    IENSResolver public immutable ensResolver;

    event CompanyRegistered(
        uint256 indexed companyId, address indexed safeAddress, string ensName, uint256 creationDate, uint256 threshold
    );
    event FoundersSet(uint256 indexed companyId, address[] wallets, uint256[] equityBps, string[] roles);
    event OwnersUpdated(uint256 indexed companyId, uint256 threshold, address[] owners);
    event ThresholdUpdated(uint256 indexed companyId, uint256 oldThreshold, uint256 newThreshold);
    event SafeLinked(uint256 indexed companyId, address indexed safeAddress, uint256 threshold);
    event MetadataUpdated(uint256 indexed companyId, string key, string value);
    event FeeCollected(uint256 indexed companyId, uint256 amount, address indexed recipient);
    event FeeRecipientProposed(address indexed newRecipient, uint256 eta);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event ENSTransferred(uint256 indexed companyId, string ensName, address indexed from, address indexed to);
    event SubdomainCreated(uint256 indexed companyId, string subdomain, address indexed owner, uint256 createdAt);
    event SubdomainRevoked(uint256 indexed companyId, string subdomain, address indexed previousOwner);
    event SafeAddressSet(uint256 indexed companyId, address indexed safeAddress);
    event GovernanceAddressSet(uint256 indexed companyId, address indexed governanceAddress);

    /// @param _initialOwner The admin — deploy this as a 2/3 Safe multisig (not an EOA).
    constructor(address _ensRegistry, address _ensResolver, address _feeRecipient, address _initialOwner)
        Ownable(_initialOwner)
    {
        ensRegistry = IENS(_ensRegistry);
        ensResolver = IENSResolver(_ensResolver);
        feeRecipient = _feeRecipient;
    }

    // --- registration ---------------------------------------------------------------------------

    /// @notice Record a company whose ENS is already registered to `_safeAddress` externally.
    /// @dev #1 caller must be an owner of `_safeAddress` (real Safe control) — closes the squat vector.
    /// #3 checks-effects-interactions: all state is written before the fee `.call`, and the function is
    /// `nonReentrant`.
    function recordCompany(string memory _ensName, address _safeAddress, Founder[] memory _founders, uint256 _threshold)
        external
        payable
        nonReentrant
        returns (uint256)
    {
        require(_founders.length > 0, "At least one founder required");
        require(_founders.length <= MAX_FOUNDERS, "Too many founders");
        require(bytes(_ensName).length > 0, "ENS name required");
        require(_safeAddress != address(0), "Invalid Safe address");
        require(addressToCompanyId[_safeAddress] == 0, "Company already registered for this Safe");
        require(ensNameToCompanyId[_ensName] == 0, "ENS name already taken");
        require(_threshold > 0 && _threshold <= _founders.length, "Invalid threshold");

        // #1 — the caller must actually control the Safe that will own the company.
        require(_safeAddress.code.length > 0, "Safe not deployed");
        require(ISafe(_safeAddress).isOwner(msg.sender), "Caller not Safe owner");

        uint256 totalEquity = 0;
        for (uint256 i = 0; i < _founders.length; i++) {
            require(_founders[i].wallet != address(0), "Invalid founder address");
            require(_founders[i].equityBps <= BPS_DENOMINATOR, "Invalid equity amount");
            totalEquity += _founders[i].equityBps;
        }
        require(totalEquity <= BPS_DENOMINATOR, "Total equity exceeds 100%");

        // ---- EFFECTS (before any external interaction) ----
        uint256 companyId = nextCompanyId++;
        Company storage newCompany = companies[companyId];
        newCompany.id = companyId;
        newCompany.companyAddress = _safeAddress;
        newCompany.ensName = _ensName;
        newCompany.creationDate = block.timestamp;
        newCompany.safeAddress = _safeAddress;
        newCompany.threshold = _threshold;

        for (uint256 i = 0; i < _founders.length; i++) {
            companyFounders[companyId].push(_founders[i]);
            _indexFounder(_founders[i].wallet, companyId);
        }

        addressToCompanyId[_safeAddress] = companyId;
        ensNameToCompanyId[_ensName] = companyId;

        emit CompanyRegistered(companyId, _safeAddress, _ensName, block.timestamp, _threshold);
        emit SafeLinked(companyId, _safeAddress, _threshold);
        _emitFounders(companyId, _founders);

        // ---- INTERACTION (last) ----
        uint256 fee = msg.value;
        if (fee > 0 && feeRecipient != address(0)) {
            (bool sent,) = feeRecipient.call{value: fee}("");
            require(sent, "Fee transfer failed");
            emit FeeCollected(companyId, fee, feeRecipient);
        }

        return companyId;
    }

    function transferENS(uint256 _companyId, address _newOwner) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only company owner can transfer ENS");
        require(_newOwner != address(0), "Invalid new owner address");

        Company storage company = companies[_companyId];
        string memory ensName = company.ensName;
        bytes32 node = _ethNode(ensName); // #5 correct namehash

        ensRegistry.setOwner(node, _newOwner);
        ensResolver.setAddr(node, _newOwner);

        addressToCompanyId[msg.sender] = 0;
        addressToCompanyId[_newOwner] = _companyId;
        company.companyAddress = _newOwner;

        emit ENSTransferred(_companyId, ensName, msg.sender, _newOwner);
    }

    // --- views ----------------------------------------------------------------------------------

    function getCompany(uint256 _companyId)
        external
        view
        returns (
            uint256 id,
            address companyAddress,
            string memory ensName,
            uint256 creationDate,
            address safeAddress,
            uint256 threshold
        )
    {
        require(companies[_companyId].id != 0, "Company does not exist");
        Company storage company = companies[_companyId];
        return
            (company.id, company.companyAddress, company.ensName, company.creationDate, company.safeAddress, company.threshold);
    }

    function getCompanyByAddress(address _address)
        external
        view
        returns (
            uint256 id,
            address companyAddress,
            string memory ensName,
            uint256 creationDate,
            address safeAddress,
            uint256 threshold
        )
    {
        uint256 companyId = addressToCompanyId[_address];
        require(companyId != 0, "No company found for this address");
        Company storage company = companies[companyId];
        return
            (company.id, company.companyAddress, company.ensName, company.creationDate, company.safeAddress, company.threshold);
    }

    function getCompanyByENS(string memory _ensName)
        external
        view
        returns (
            uint256 id,
            address companyAddress,
            string memory ensName,
            uint256 creationDate,
            address safeAddress,
            uint256 threshold
        )
    {
        uint256 companyId = ensNameToCompanyId[_ensName];
        require(companyId != 0, "No company found for this ENS name");
        Company storage company = companies[companyId];
        return
            (company.id, company.companyAddress, company.ensName, company.creationDate, company.safeAddress, company.threshold);
    }

    function getCompanyFounders(uint256 _companyId) external view returns (Founder[] memory) {
        require(companies[_companyId].id != 0, "Company does not exist");
        return companyFounders[_companyId];
    }

    function getCompanyFounderAddresses(uint256 _companyId) external view returns (address[] memory) {
        require(companies[_companyId].id != 0, "Company does not exist");
        Founder[] storage founders = companyFounders[_companyId];
        address[] memory addresses = new address[](founders.length);
        for (uint256 i = 0; i < founders.length; i++) {
            addresses[i] = founders[i].wallet;
        }
        return addresses;
    }

    /// @notice #6 — O(1) reverse lookup: companies a wallet has been a founder of (append-only; confirm
    /// current membership with `isFounder`). Replaces the off-chain full-registry scan.
    function getCompaniesByFounder(address _founder) external view returns (uint256[] memory) {
        return founderCompanies[_founder];
    }

    /// @notice Whether `_account` is currently a founder of `_companyId` (backs AttestationModule auth).
    function isFounder(uint256 _companyId, address _account) public view returns (bool) {
        Founder[] storage founders = companyFounders[_companyId];
        for (uint256 i = 0; i < founders.length; i++) {
            if (founders[i].wallet == _account) return true;
        }
        return false;
    }

    function getTotalCompanies() external view returns (uint256) {
        return nextCompanyId - 1;
    }

    // --- subdomains -----------------------------------------------------------------------------

    /// @dev Requires this contract to be an approved operator of the company node in the ENS registry
    /// (the Safe owns the name and authorizes the contract via `setApprovalForAll`) — see SECURITY notes.
    function createSubdomain(uint256 _companyId, string memory _subdomain, address _owner) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only company owner can create subdomains");
        require(_owner != address(0), "Invalid owner address");
        require(bytes(_subdomain).length > 0, "Subdomain name required");
        require(!subdomains[_companyId][_subdomain].active, "Subdomain already exists");

        Company storage company = companies[_companyId];
        bytes32 companyNode = _ethNode(company.ensName); // #5 correct namehash
        bytes32 subdomainLabel = keccak256(bytes(_subdomain));

        ensRegistry.setSubnodeOwner(companyNode, subdomainLabel, _owner);

        bytes32 subdomainNode = keccak256(abi.encodePacked(companyNode, subdomainLabel));
        ensResolver.setAddr(subdomainNode, _owner);

        subdomains[_companyId][_subdomain] =
            Subdomain({name: _subdomain, owner: _owner, createdAt: block.timestamp, active: true});
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
        bytes32 companyNode = _ethNode(company.ensName); // #5 correct namehash
        bytes32 subdomainLabel = keccak256(bytes(_subdomain));

        ensRegistry.setSubnodeOwner(companyNode, subdomainLabel, address(0));
        subdomain.active = false;

        emit SubdomainRevoked(_companyId, _subdomain, previousOwner);
    }

    function getSubdomain(uint256 _companyId, string memory _subdomain)
        external
        view
        returns (string memory name, address subdomainOwner, uint256 createdAt, bool active)
    {
        require(companies[_companyId].id != 0, "Company does not exist");
        Subdomain storage subdomain = subdomains[_companyId][_subdomain];
        return (subdomain.name, subdomain.owner, subdomain.createdAt, subdomain.active);
    }

    function getCompanySubdomains(uint256 _companyId) external view returns (string[] memory) {
        require(companies[_companyId].id != 0, "Company does not exist");
        return companySubdomains[_companyId];
    }

    // --- Safe / governance integration ----------------------------------------------------------

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

    function updateThreshold(uint256 _companyId, uint256 _newThreshold) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only Safe can update threshold");
        require(_newThreshold > 0, "Invalid threshold");
        uint256 oldThreshold = companies[_companyId].threshold;
        companies[_companyId].threshold = _newThreshold;
        emit ThresholdUpdated(_companyId, oldThreshold, _newThreshold);
    }

    function updateFounders(uint256 _companyId, Founder[] memory _founders) external {
        require(companies[_companyId].id != 0, "Company does not exist");
        require(companies[_companyId].companyAddress == msg.sender, "Only Safe can update founders");
        require(_founders.length > 0, "At least one founder required");
        require(_founders.length <= MAX_FOUNDERS, "Too many founders");

        uint256 totalEquity = 0;
        for (uint256 i = 0; i < _founders.length; i++) {
            require(_founders[i].wallet != address(0), "Invalid founder address");
            totalEquity += _founders[i].equityBps;
        }
        require(totalEquity <= BPS_DENOMINATOR, "Total equity exceeds 100%");

        delete companyFounders[_companyId];
        for (uint256 i = 0; i < _founders.length; i++) {
            companyFounders[_companyId].push(_founders[i]);
            _indexFounder(_founders[i].wallet, _companyId);
        }

        _emitFounders(_companyId, _founders);
        address[] memory wallets = new address[](_founders.length);
        for (uint256 i = 0; i < _founders.length; i++) {
            wallets[i] = _founders[i].wallet;
        }
        emit OwnersUpdated(_companyId, companies[_companyId].threshold, wallets);
    }

    // --- admin (Ownable2Step + timelock) --------------------------------------------------------

    /// @notice #2 — propose a new fee recipient; executable after `FEE_RECIPIENT_TIMELOCK`.
    function proposeFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        pendingFeeRecipient = _newRecipient;
        pendingFeeRecipientEta = block.timestamp + FEE_RECIPIENT_TIMELOCK;
        emit FeeRecipientProposed(_newRecipient, pendingFeeRecipientEta);
    }

    /// @notice #2 — execute the pending fee-recipient change after the timelock elapses.
    function executeFeeRecipient() external onlyOwner {
        require(pendingFeeRecipientEta != 0, "No pending change");
        require(block.timestamp >= pendingFeeRecipientEta, "Timelock not elapsed");
        address oldRecipient = feeRecipient;
        feeRecipient = pendingFeeRecipient;
        pendingFeeRecipient = address(0);
        pendingFeeRecipientEta = 0;
        emit FeeRecipientUpdated(oldRecipient, feeRecipient);
    }

    function calculateFee(uint256 _amount) external pure returns (uint256) {
        return (_amount * SERVICE_FEE_BPS) / BPS_DENOMINATOR;
    }

    /// @notice Withdraw stuck ETH to the owner (the Safe).
    function withdraw() external onlyOwner {
        (bool sent,) = owner().call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }

    receive() external payable {}

    // --- internal -------------------------------------------------------------------------------

    function _ethNode(string memory name) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(ETH_NODE, keccak256(bytes(name))));
    }

    function _indexFounder(address wallet, uint256 companyId) private {
        uint256[] storage list = founderCompanies[wallet];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == companyId) return; // already indexed
        }
        list.push(companyId);
    }

    function _emitFounders(uint256 companyId, Founder[] memory _founders) private {
        address[] memory wallets = new address[](_founders.length);
        uint256[] memory equities = new uint256[](_founders.length);
        string[] memory roles = new string[](_founders.length);
        for (uint256 i = 0; i < _founders.length; i++) {
            wallets[i] = _founders[i].wallet;
            equities[i] = _founders[i].equityBps;
            roles[i] = _founders[i].role;
        }
        emit FoundersSet(companyId, wallets, equities, roles);
    }
}
