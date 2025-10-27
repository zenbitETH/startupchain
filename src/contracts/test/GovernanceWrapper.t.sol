// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {GovernanceWrapper} from "../src/GovernanceWrapper.sol";

contract MockGnosisSafe {
    address[] public owners;
    uint256 public threshold;

    constructor(address[] memory _owners, uint256 _threshold) {
        owners = _owners;
        threshold = _threshold;
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getThreshold() external view returns (uint256) {
        return threshold;
    }

    function isOwner(address owner) external view returns (bool) {
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == owner) return true;
        }
        return false;
    }

    function addOwner(address owner) external {
        owners.push(owner);
    }
}

contract GovernanceWrapperTest is Test {
    GovernanceWrapper public governance;
    MockGnosisSafe public safe;

    address public registryAddress = address(1);
    address public owner1 = address(2);
    address public owner2 = address(3);
    address public owner3 = address(4);
    address public nonOwner = address(5);

    uint256 public constant COMPANY_ID = 1;

    function setUp() public {
        governance = new GovernanceWrapper(registryAddress);

        address[] memory owners = new address[](3);
        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;

        safe = new MockGnosisSafe(owners, 2);
        governance.initializeCompanySafe(COMPANY_ID, address(safe));
    }

    function testCreateProposal() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Proposal to transfer funds",
            address(0x123),
            1 ether,
            ""
        );

        assertEq(proposalId, 1);

        (
            uint256 id,
            uint256 companyId,
            address proposer,
            string memory description,
            address target,
            uint256 value,
            ,,,
            GovernanceWrapper.ProposalState state,
            ,
        ) = governance.getProposal(proposalId);

        assertEq(id, proposalId);
        assertEq(companyId, COMPANY_ID);
        assertEq(proposer, owner1);
        assertEq(description, "Proposal to transfer funds");
        assertEq(target, address(0x123));
        assertEq(value, 1 ether);
        assertTrue(state == GovernanceWrapper.ProposalState.Active);
    }

    function testNonMemberCannotCreateProposal() public {
        vm.prank(nonOwner);
        vm.expectRevert("Not a Safe member");
        governance.createProposal(
            COMPANY_ID,
            "Proposal",
            address(0x123),
            1 ether,
            ""
        );
    }

    function testCastVote() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Test Proposal",
            address(0x123),
            1 ether,
            ""
        );

        vm.prank(owner2);
        governance.castVote(proposalId, GovernanceWrapper.VoteType.For);

        assertTrue(governance.hasVotedOnProposal(proposalId, owner2));
        assertEq(uint(governance.getVote(proposalId, owner2)), uint(GovernanceWrapper.VoteType.For));
    }

    function testCannotVoteTwice() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Test Proposal",
            address(0x123),
            1 ether,
            ""
        );

        vm.startPrank(owner2);
        governance.castVote(proposalId, GovernanceWrapper.VoteType.For);

        vm.expectRevert("Already voted");
        governance.castVote(proposalId, GovernanceWrapper.VoteType.Against);
        vm.stopPrank();
    }

    function testNonMemberCannotVote() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Test Proposal",
            address(0x123),
            1 ether,
            ""
        );

        vm.prank(nonOwner);
        vm.expectRevert("Not a Safe member");
        governance.castVote(proposalId, GovernanceWrapper.VoteType.For);
    }

    function testProposalPasses() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Test Proposal",
            address(0x123),
            1 ether,
            ""
        );

        // Vote with majority (2 out of 3)
        vm.prank(owner1);
        governance.castVote(proposalId, GovernanceWrapper.VoteType.For);

        vm.prank(owner2);
        governance.castVote(proposalId, GovernanceWrapper.VoteType.For);

        // Fast forward past voting period
        vm.warp(block.timestamp + 4 days);

        GovernanceWrapper.ProposalState state = governance.getProposalState(proposalId);
        assertTrue(state == GovernanceWrapper.ProposalState.Passed);
    }

    function testProposalFails() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Test Proposal",
            address(0x123),
            1 ether,
            ""
        );

        // Vote with minority
        vm.prank(owner1);
        governance.castVote(proposalId, GovernanceWrapper.VoteType.For);

        vm.prank(owner2);
        governance.castVote(proposalId, GovernanceWrapper.VoteType.Against);

        vm.prank(owner3);
        governance.castVote(proposalId, GovernanceWrapper.VoteType.Against);

        // Fast forward past voting period
        vm.warp(block.timestamp + 4 days);

        GovernanceWrapper.ProposalState state = governance.getProposalState(proposalId);
        assertTrue(state == GovernanceWrapper.ProposalState.Failed);
    }

    function testCannotVoteAfterVotingPeriod() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Test Proposal",
            address(0x123),
            1 ether,
            ""
        );

        // Fast forward past voting period
        vm.warp(block.timestamp + 4 days);

        vm.prank(owner2);
        vm.expectRevert("Voting period ended");
        governance.castVote(proposalId, GovernanceWrapper.VoteType.For);
    }

    function testCancelProposal() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Test Proposal",
            address(0x123),
            1 ether,
            ""
        );

        vm.prank(owner1);
        governance.cancelProposal(proposalId);

        (,,,,,,, uint256 votesFor, uint256 votesAgainst, GovernanceWrapper.ProposalState state, bool executed, bool cancelled) =
            governance.getProposal(proposalId);

        assertTrue(cancelled);
        assertFalse(executed);
        assertTrue(state == GovernanceWrapper.ProposalState.Cancelled);
    }

    function testOnlyProposerCanCancel() public {
        vm.prank(owner1);
        uint256 proposalId = governance.createProposal(
            COMPANY_ID,
            "Test Proposal",
            address(0x123),
            1 ether,
            ""
        );

        vm.prank(owner2);
        vm.expectRevert("Only proposer can cancel");
        governance.cancelProposal(proposalId);
    }

    function testGetCompanyProposals() public {
        vm.startPrank(owner1);
        governance.createProposal(COMPANY_ID, "Proposal 1", address(0x123), 1 ether, "");
        governance.createProposal(COMPANY_ID, "Proposal 2", address(0x456), 2 ether, "");
        vm.stopPrank();

        uint256[] memory proposals = governance.getCompanyProposals(COMPANY_ID);
        assertEq(proposals.length, 2);
        assertEq(proposals[0], 1);
        assertEq(proposals[1], 2);
    }
}
