// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IEAS {
    struct AttestationRequest {
        bytes32 schema;
        AttestationRequestData data;
    }

    struct AttestationRequestData {
        address recipient;
        uint64 expirationTime;
        bool revocable;
        bytes32 refUID;
        bytes data;
        uint256 value;
    }

    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    function attest(AttestationRequest calldata request) external payable returns (bytes32);
    function revoke(bytes32 uid) external;
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}

contract AttestationModule {
    enum AttestationType {
        CompanyFormation,
        GovernanceDecision,
        FinancialTransaction,
        MilestoneAchievement,
        MembershipChange,
        ContractDeployment,
        Custom
    }

    struct CompanyAttestation {
        bytes32 uid;
        uint256 companyId;
        AttestationType attestationType;
        string description;
        uint256 timestamp;
        address attester;
        bool revoked;
    }

    IEAS public immutable eas;
    address public immutable startupChainRegistry;

    // Schema UIDs for different attestation types (set during deployment)
    bytes32 public companyFormationSchema;
    bytes32 public governanceDecisionSchema;
    bytes32 public financialTransactionSchema;
    bytes32 public milestoneAchievementSchema;
    bytes32 public membershipChangeSchema;
    bytes32 public contractDeploymentSchema;

    mapping(bytes32 => CompanyAttestation) public attestations;
    mapping(uint256 => bytes32[]) public companyAttestations;
    mapping(uint256 => mapping(AttestationType => uint256)) public attestationCounts;

    event AttestationCreated(
        bytes32 indexed uid,
        uint256 indexed companyId,
        AttestationType attestationType,
        address indexed attester,
        string description
    );

    event AttestationRevoked(
        bytes32 indexed uid,
        uint256 indexed companyId,
        address indexed revoker
    );

    event SchemaRegistered(
        AttestationType attestationType,
        bytes32 schema
    );

    modifier onlyCompanyMember(uint256 _companyId) {
        // In production, this would check against StartupChain registry
        // For now, we'll allow any address to attest (can be restricted later)
        _;
    }

    constructor(address _eas, address _startupChainRegistry) {
        eas = IEAS(_eas);
        startupChainRegistry = _startupChainRegistry;
    }

    // Schema management functions
    function setCompanyFormationSchema(bytes32 _schema) external {
        require(companyFormationSchema == bytes32(0), "Schema already set");
        companyFormationSchema = _schema;
        emit SchemaRegistered(AttestationType.CompanyFormation, _schema);
    }

    function setGovernanceDecisionSchema(bytes32 _schema) external {
        require(governanceDecisionSchema == bytes32(0), "Schema already set");
        governanceDecisionSchema = _schema;
        emit SchemaRegistered(AttestationType.GovernanceDecision, _schema);
    }

    function setFinancialTransactionSchema(bytes32 _schema) external {
        require(financialTransactionSchema == bytes32(0), "Schema already set");
        financialTransactionSchema = _schema;
        emit SchemaRegistered(AttestationType.FinancialTransaction, _schema);
    }

    function setMilestoneAchievementSchema(bytes32 _schema) external {
        require(milestoneAchievementSchema == bytes32(0), "Schema already set");
        milestoneAchievementSchema = _schema;
        emit SchemaRegistered(AttestationType.MilestoneAchievement, _schema);
    }

    function setMembershipChangeSchema(bytes32 _schema) external {
        require(membershipChangeSchema == bytes32(0), "Schema already set");
        membershipChangeSchema = _schema;
        emit SchemaRegistered(AttestationType.MembershipChange, _schema);
    }

    function setContractDeploymentSchema(bytes32 _schema) external {
        require(contractDeploymentSchema == bytes32(0), "Schema already set");
        contractDeploymentSchema = _schema;
        emit SchemaRegistered(AttestationType.ContractDeployment, _schema);
    }

    // Attestation creation functions
    function createAttestation(
        uint256 _companyId,
        AttestationType _attestationType,
        string memory _description,
        bytes memory _data
    ) public onlyCompanyMember(_companyId) returns (bytes32) {
        bytes32 schema = _getSchemaForType(_attestationType);
        require(schema != bytes32(0), "Schema not configured for this type");

        // Create attestation data
        bytes memory attestationData = abi.encode(
            _companyId,
            _attestationType,
            _description,
            block.timestamp,
            _data
        );

        // Create EAS attestation
        IEAS.AttestationRequestData memory requestData = IEAS.AttestationRequestData({
            recipient: address(this), // Attestation recipient is this contract
            expirationTime: 0, // No expiration
            revocable: true,
            refUID: bytes32(0),
            data: attestationData,
            value: 0
        });

        IEAS.AttestationRequest memory request = IEAS.AttestationRequest({
            schema: schema,
            data: requestData
        });

        bytes32 uid = eas.attest(request);

        // Store attestation metadata
        attestations[uid] = CompanyAttestation({
            uid: uid,
            companyId: _companyId,
            attestationType: _attestationType,
            description: _description,
            timestamp: block.timestamp,
            attester: msg.sender,
            revoked: false
        });

        companyAttestations[_companyId].push(uid);
        attestationCounts[_companyId][_attestationType]++;

        emit AttestationCreated(
            uid,
            _companyId,
            _attestationType,
            msg.sender,
            _description
        );

        return uid;
    }

    function attestCompanyFormation(
        uint256 _companyId,
        string memory _companyName,
        address[] memory _founders
    ) external returns (bytes32) {
        bytes memory data = abi.encode(_companyName, _founders);
        return createAttestation(
            _companyId,
            AttestationType.CompanyFormation,
            string(abi.encodePacked("Company formed: ", _companyName)),
            data
        );
    }

    function attestGovernanceDecision(
        uint256 _companyId,
        uint256 _proposalId,
        string memory _decision
    ) external returns (bytes32) {
        bytes memory data = abi.encode(_proposalId, _decision);
        return createAttestation(
            _companyId,
            AttestationType.GovernanceDecision,
            _decision,
            data
        );
    }

    function attestFinancialTransaction(
        uint256 _companyId,
        string memory _description,
        uint256 _amount,
        address _recipient
    ) external returns (bytes32) {
        bytes memory data = abi.encode(_amount, _recipient);
        return createAttestation(
            _companyId,
            AttestationType.FinancialTransaction,
            _description,
            data
        );
    }

    function attestMilestone(
        uint256 _companyId,
        string memory _milestone,
        string memory _evidence
    ) external returns (bytes32) {
        bytes memory data = abi.encode(_milestone, _evidence);
        return createAttestation(
            _companyId,
            AttestationType.MilestoneAchievement,
            _milestone,
            data
        );
    }

    function attestMembershipChange(
        uint256 _companyId,
        address _member,
        bool _added,
        string memory _role
    ) external returns (bytes32) {
        bytes memory data = abi.encode(_member, _added, _role);
        string memory description = _added
            ? string(abi.encodePacked("Member added: ", _role))
            : string(abi.encodePacked("Member removed: ", _role));

        return createAttestation(
            _companyId,
            AttestationType.MembershipChange,
            description,
            data
        );
    }

    function revokeAttestation(bytes32 _uid) external {
        CompanyAttestation storage attestation = attestations[_uid];
        require(attestation.uid != bytes32(0), "Attestation does not exist");
        require(!attestation.revoked, "Attestation already revoked");
        require(attestation.attester == msg.sender, "Only attester can revoke");

        // Revoke on EAS
        eas.revoke(_uid);

        attestation.revoked = true;

        emit AttestationRevoked(_uid, attestation.companyId, msg.sender);
    }

    // View functions
    function getAttestation(bytes32 _uid) external view returns (
        bytes32 uid,
        uint256 companyId,
        AttestationType attestationType,
        string memory description,
        uint256 timestamp,
        address attester,
        bool revoked
    ) {
        CompanyAttestation storage attestation = attestations[_uid];
        require(attestation.uid != bytes32(0), "Attestation does not exist");

        return (
            attestation.uid,
            attestation.companyId,
            attestation.attestationType,
            attestation.description,
            attestation.timestamp,
            attestation.attester,
            attestation.revoked
        );
    }

    function getCompanyAttestations(uint256 _companyId) external view returns (bytes32[] memory) {
        return companyAttestations[_companyId];
    }

    function getAttestationCount(
        uint256 _companyId,
        AttestationType _attestationType
    ) external view returns (uint256) {
        return attestationCounts[_companyId][_attestationType];
    }

    function _getSchemaForType(AttestationType _type) internal view returns (bytes32) {
        if (_type == AttestationType.CompanyFormation) return companyFormationSchema;
        if (_type == AttestationType.GovernanceDecision) return governanceDecisionSchema;
        if (_type == AttestationType.FinancialTransaction) return financialTransactionSchema;
        if (_type == AttestationType.MilestoneAchievement) return milestoneAchievementSchema;
        if (_type == AttestationType.MembershipChange) return membershipChangeSchema;
        if (_type == AttestationType.ContractDeployment) return contractDeploymentSchema;
        return bytes32(0);
    }
}
