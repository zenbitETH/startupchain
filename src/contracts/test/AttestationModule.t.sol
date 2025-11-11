// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {AttestationModule, IEAS} from "../src/AttestationModule.sol";

contract MockEAS is IEAS {
    mapping(bytes32 => Attestation) public attestations;
    uint256 private nonce;

    function attest(AttestationRequest calldata request) external payable returns (bytes32) {
        bytes32 uid = keccak256(abi.encodePacked(nonce++, msg.sender, block.timestamp));

        attestations[uid] = Attestation({
            uid: uid,
            schema: request.schema,
            time: uint64(block.timestamp),
            expirationTime: request.data.expirationTime,
            revocationTime: 0,
            refUID: request.data.refUID,
            recipient: request.data.recipient,
            attester: msg.sender,
            revocable: request.data.revocable,
            data: request.data.data
        });

        return uid;
    }

    function revoke(bytes32 uid) external {
        require(attestations[uid].uid != bytes32(0), "Attestation does not exist");
        attestations[uid].revocationTime = uint64(block.timestamp);
    }

    function getAttestation(bytes32 uid) external view returns (Attestation memory) {
        return attestations[uid];
    }
}

contract AttestationModuleTest is Test {
    AttestationModule public attestationModule;
    MockEAS public eas;

    address public registryAddress = address(1);
    address public companyOwner = address(2);
    address public member = address(3);

    uint256 public constant COMPANY_ID = 1;

    bytes32 public constant COMPANY_FORMATION_SCHEMA = keccak256("CompanyFormation");
    bytes32 public constant GOVERNANCE_DECISION_SCHEMA = keccak256("GovernanceDecision");
    bytes32 public constant FINANCIAL_TRANSACTION_SCHEMA = keccak256("FinancialTransaction");
    bytes32 public constant MILESTONE_ACHIEVEMENT_SCHEMA = keccak256("MilestoneAchievement");
    bytes32 public constant MEMBERSHIP_CHANGE_SCHEMA = keccak256("MembershipChange");

    function setUp() public {
        eas = new MockEAS();
        attestationModule = new AttestationModule(address(eas), registryAddress);

        // Set up schemas
        attestationModule.setCompanyFormationSchema(COMPANY_FORMATION_SCHEMA);
        attestationModule.setGovernanceDecisionSchema(GOVERNANCE_DECISION_SCHEMA);
        attestationModule.setFinancialTransactionSchema(FINANCIAL_TRANSACTION_SCHEMA);
        attestationModule.setMilestoneAchievementSchema(MILESTONE_ACHIEVEMENT_SCHEMA);
        attestationModule.setMembershipChangeSchema(MEMBERSHIP_CHANGE_SCHEMA);
    }

    function testCreateAttestation() public {
        vm.prank(companyOwner);
        bytes32 uid = attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.CompanyFormation,
            "Company formed",
            ""
        );

        assertTrue(uid != bytes32(0));

        (
            bytes32 attestationUid,
            uint256 companyId,
            AttestationModule.AttestationType attestationType,
            string memory description,
            uint256 timestamp,
            address attester,
            bool revoked
        ) = attestationModule.getAttestation(uid);

        assertEq(attestationUid, uid);
        assertEq(companyId, COMPANY_ID);
        assertTrue(attestationType == AttestationModule.AttestationType.CompanyFormation);
        assertEq(description, "Company formed");
        assertGt(timestamp, 0);
        assertEq(attester, companyOwner);
        assertFalse(revoked);
    }

    function testAttestCompanyFormation() public {
        address[] memory founders = new address[](2);
        founders[0] = companyOwner;
        founders[1] = member;

        vm.prank(companyOwner);
        bytes32 uid = attestationModule.attestCompanyFormation(
            COMPANY_ID,
            "TestCompany",
            founders
        );

        assertTrue(uid != bytes32(0));

        (,, AttestationModule.AttestationType attestationType,,,, ) =
            attestationModule.getAttestation(uid);

        assertTrue(attestationType == AttestationModule.AttestationType.CompanyFormation);
    }

    function testAttestGovernanceDecision() public {
        vm.prank(companyOwner);
        bytes32 uid = attestationModule.attestGovernanceDecision(
            COMPANY_ID,
            1, // proposalId
            "Approved budget increase"
        );

        assertTrue(uid != bytes32(0));

        (,, AttestationModule.AttestationType attestationType,,,, ) =
            attestationModule.getAttestation(uid);

        assertTrue(attestationType == AttestationModule.AttestationType.GovernanceDecision);
    }

    function testAttestFinancialTransaction() public {
        vm.prank(companyOwner);
        bytes32 uid = attestationModule.attestFinancialTransaction(
            COMPANY_ID,
            "Payment to contractor",
            1 ether,
            address(0x123)
        );

        assertTrue(uid != bytes32(0));

        (,, AttestationModule.AttestationType attestationType,,,, ) =
            attestationModule.getAttestation(uid);

        assertTrue(attestationType == AttestationModule.AttestationType.FinancialTransaction);
    }

    function testAttestMilestone() public {
        vm.prank(companyOwner);
        bytes32 uid = attestationModule.attestMilestone(
            COMPANY_ID,
            "MVP Launch",
            "Product deployed to production"
        );

        assertTrue(uid != bytes32(0));

        (,, AttestationModule.AttestationType attestationType,,,, ) =
            attestationModule.getAttestation(uid);

        assertTrue(attestationType == AttestationModule.AttestationType.MilestoneAchievement);
    }

    function testAttestMembershipChange() public {
        vm.prank(companyOwner);
        bytes32 uid = attestationModule.attestMembershipChange(
            COMPANY_ID,
            member,
            true,
            "Developer"
        );

        assertTrue(uid != bytes32(0));

        (
            ,
            ,
            AttestationModule.AttestationType attestationType,
            string memory description,
            ,
            ,
        ) = attestationModule.getAttestation(uid);

        assertTrue(attestationType == AttestationModule.AttestationType.MembershipChange);
        assertEq(description, "Member added: Developer");
    }

    function testRevokeAttestation() public {
        vm.prank(companyOwner);
        bytes32 uid = attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.CompanyFormation,
            "Test attestation",
            ""
        );

        vm.prank(companyOwner);
        attestationModule.revokeAttestation(uid);

        (,,,,,, bool revoked) = attestationModule.getAttestation(uid);
        assertTrue(revoked);
    }

    function testOnlyAttesterCanRevoke() public {
        vm.prank(companyOwner);
        bytes32 uid = attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.CompanyFormation,
            "Test attestation",
            ""
        );

        vm.prank(member);
        vm.expectRevert("Only attester can revoke");
        attestationModule.revokeAttestation(uid);
    }

    function testCannotRevokeAlreadyRevokedAttestation() public {
        vm.prank(companyOwner);
        bytes32 uid = attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.CompanyFormation,
            "Test attestation",
            ""
        );

        vm.startPrank(companyOwner);
        attestationModule.revokeAttestation(uid);

        vm.expectRevert("Attestation already revoked");
        attestationModule.revokeAttestation(uid);
        vm.stopPrank();
    }

    function testGetCompanyAttestations() public {
        vm.startPrank(companyOwner);

        bytes32 uid1 = attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.CompanyFormation,
            "Attestation 1",
            ""
        );

        bytes32 uid2 = attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.MilestoneAchievement,
            "Attestation 2",
            ""
        );

        vm.stopPrank();

        bytes32[] memory attestations = attestationModule.getCompanyAttestations(COMPANY_ID);
        assertEq(attestations.length, 2);
        assertEq(attestations[0], uid1);
        assertEq(attestations[1], uid2);
    }

    function testGetAttestationCount() public {
        vm.startPrank(companyOwner);

        attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.CompanyFormation,
            "Attestation 1",
            ""
        );

        attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.CompanyFormation,
            "Attestation 2",
            ""
        );

        attestationModule.createAttestation(
            COMPANY_ID,
            AttestationModule.AttestationType.MilestoneAchievement,
            "Attestation 3",
            ""
        );

        vm.stopPrank();

        uint256 formationCount = attestationModule.getAttestationCount(
            COMPANY_ID,
            AttestationModule.AttestationType.CompanyFormation
        );
        assertEq(formationCount, 2);

        uint256 milestoneCount = attestationModule.getAttestationCount(
            COMPANY_ID,
            AttestationModule.AttestationType.MilestoneAchievement
        );
        assertEq(milestoneCount, 1);
    }

    function testCannotSetSchemaTwice() public {
        vm.expectRevert("Schema already set");
        attestationModule.setCompanyFormationSchema(keccak256("NewSchema"));
    }
}
