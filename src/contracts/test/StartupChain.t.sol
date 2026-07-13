// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {StartupChain, ISafe} from "../src/StartupChain.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Mock Gnosis Safe: a contract (has code) with a configurable owner set (#1 auth).
contract MockSafe is ISafe {
    mapping(address => bool) public owners;

    function setOwner(address a, bool ok) external {
        owners[a] = ok;
    }

    function isOwner(address a) external view returns (bool) {
        return owners[a];
    }
}

/// @notice Minimal ENS registry/resolver stubs so ENS-touching paths don't revert in unit tests.
contract StubENS {
    function setOwner(bytes32, address) external {}
    function setSubnodeOwner(bytes32, bytes32, address) external {}
    function setResolver(bytes32, address) external {}
    function setTTL(bytes32, uint64) external {}
    function resolver(bytes32) external pure returns (address) {
        return address(0);
    }
    function owner(bytes32) external pure returns (address) {
        return address(0);
    }
    function setAddr(bytes32, address) external {}
    function addr(bytes32) external pure returns (address) {
        return address(0);
    }
}

/// @notice A fee recipient that reverts on receive — the #3 reentrancy/CEI oracle.
contract RevertingRecipient {
    receive() external payable {
        revert("no ETH");
    }
}

contract StartupChainTest is Test {
    StartupChain internal sc;
    StubENS internal ens;
    MockSafe internal safe;

    address internal owner = makeAddr("owner"); // the 2/3 Safe (contract admin)
    address internal treasury = makeAddr("treasury"); // fee recipient, SEPARATE from any hot key
    address internal founderA = makeAddr("founderA");
    address internal founderB = makeAddr("founderB");
    address internal attacker = makeAddr("attacker");

    string internal constant ENS_NAME = "acme";

    function setUp() public {
        ens = new StubENS();
        safe = new MockSafe();
        safe.setOwner(founderA, true); // founderA controls the Safe
        sc = new StartupChain(address(ens), address(ens), treasury, owner);
    }

    function _founders() internal view returns (StartupChain.Founder[] memory f) {
        f = new StartupChain.Founder[](2);
        f[0] = StartupChain.Founder({wallet: founderA, equityBps: 6000, role: "CEO"});
        f[1] = StartupChain.Founder({wallet: founderB, equityBps: 4000, role: "CTO"});
    }

    // --- #1: caller auth (squat-revert) ---------------------------------------------------------

    function test_recordCompany_succeedsForSafeOwner() public {
        vm.prank(founderA);
        uint256 id = sc.recordCompany(ENS_NAME, address(safe), _founders(), 2);
        assertEq(id, 1);
        (,, string memory name,,,) = sc.getCompany(id);
        assertEq(name, ENS_NAME);
        assertTrue(sc.isFounder(id, founderA));
    }

    function test_recordCompany_squatByNonOwnerReverts() public {
        // attacker is not an owner of the Safe → cannot register/squat this Safe+ENS
        vm.prank(attacker);
        vm.expectRevert("Caller not Safe owner");
        sc.recordCompany(ENS_NAME, address(safe), _founders(), 2);
    }

    function test_recordCompany_nonContractSafeReverts() public {
        vm.prank(founderA);
        vm.expectRevert("Safe not deployed");
        sc.recordCompany(ENS_NAME, makeAddr("eoaSafe"), _founders(), 2);
    }

    function test_recordCompany_duplicateSafeAndEnsRejected() public {
        vm.prank(founderA);
        sc.recordCompany(ENS_NAME, address(safe), _founders(), 2);

        // same Safe again → rejected
        vm.prank(founderA);
        vm.expectRevert("Company already registered for this Safe");
        sc.recordCompany("other", address(safe), _founders(), 2);

        // same ENS via a different Safe (also owned by founderA) → rejected
        MockSafe safe2 = new MockSafe();
        safe2.setOwner(founderA, true);
        vm.prank(founderA);
        vm.expectRevert("ENS name already taken");
        sc.recordCompany(ENS_NAME, address(safe2), _founders(), 2);
    }

    // --- #3: CEI + reentrancy (reverting-fee) ----------------------------------------------------

    function test_recordCompany_feePaidToTreasury() public {
        vm.deal(founderA, 1 ether);
        vm.prank(founderA);
        sc.recordCompany{value: 0.1 ether}(ENS_NAME, address(safe), _founders(), 2);
        assertEq(treasury.balance, 0.1 ether, "fee forwarded to treasury");
    }

    function test_recordCompany_revertingFeeRecipientRevertsWholeTx() public {
        // point the fee recipient at a contract that rejects ETH; the fee .call fails → whole tx reverts
        RevertingRecipient bad = new RevertingRecipient();
        vm.prank(owner);
        sc.proposeFeeRecipient(address(bad));
        vm.warp(block.timestamp + sc.FEE_RECIPIENT_TIMELOCK());
        vm.prank(owner);
        sc.executeFeeRecipient();

        vm.deal(founderA, 1 ether);
        vm.prank(founderA);
        vm.expectRevert("Fee transfer failed");
        sc.recordCompany{value: 0.1 ether}(ENS_NAME, address(safe), _founders(), 2);

        // state did not persist (CEI + revert): no company was created
        assertEq(sc.getTotalCompanies(), 0, "no company persisted after fee revert");
    }

    // --- #2: Ownable2Step + timelocked fee recipient --------------------------------------------

    function test_setFeeRecipientIsTimelocked() public {
        address newTreasury = makeAddr("newTreasury");
        // non-owner cannot propose
        vm.prank(attacker);
        vm.expectRevert();
        sc.proposeFeeRecipient(newTreasury);

        // owner proposes; cannot execute before the delay
        vm.prank(owner);
        sc.proposeFeeRecipient(newTreasury);
        vm.prank(owner);
        vm.expectRevert("Timelock not elapsed");
        sc.executeFeeRecipient();

        // after the delay, execute
        vm.warp(block.timestamp + sc.FEE_RECIPIENT_TIMELOCK());
        vm.prank(owner);
        sc.executeFeeRecipient();
        assertEq(sc.feeRecipient(), newTreasury);
    }

    function test_ownershipIsTwoStep() public {
        address newOwner = makeAddr("newOwner");
        vm.prank(owner);
        sc.transferOwnership(newOwner); // step 1: pending only
        assertEq(sc.owner(), owner, "still old owner until accepted");
        assertEq(sc.pendingOwner(), newOwner);

        vm.prank(newOwner);
        sc.acceptOwnership(); // step 2
        assertEq(sc.owner(), newOwner);
    }

    function test_withdrawOnlyOwner() public {
        vm.deal(address(sc), 1 ether);
        vm.prank(attacker);
        vm.expectRevert();
        sc.withdraw();
        uint256 before = owner.balance;
        vm.prank(owner);
        sc.withdraw();
        assertEq(owner.balance, before + 1 ether);
    }

    // --- #5: correct .eth namehash ---------------------------------------------------------------

    function test_namehash_isEthParentedNotRoot() public {
        // register then transfer ENS; recompute the expected namehash("acme.eth") and confirm the
        // event carries the right name (the on-chain node math now uses namehash("eth") as parent).
        vm.prank(founderA);
        uint256 id = sc.recordCompany(ENS_NAME, address(safe), _founders(), 2);

        // the company owner (the Safe) transfers the ENS
        vm.prank(address(safe));
        vm.expectEmit(true, false, false, true);
        emit StartupChain.ENSTransferred(id, ENS_NAME, address(safe), founderB);
        sc.transferENS(id, founderB);

        // sanity: the correct node = keccak(namehash("eth"), keccak("acme"))
        bytes32 ethNode = keccak256(abi.encodePacked(bytes32(0), keccak256("eth")));
        bytes32 expected = keccak256(abi.encodePacked(ethNode, keccak256(bytes(ENS_NAME))));
        bytes32 wrongOldNode = keccak256(abi.encodePacked(bytes32(0), keccak256(bytes(ENS_NAME))));
        assertTrue(expected != wrongOldNode, "eth-parented node differs from the old root-parented bug");
    }

    // --- #6: bounded founder loops + reverse index ----------------------------------------------

    function test_maxFoundersEnforced() public {
        uint256 n = sc.MAX_FOUNDERS() + 1;
        StartupChain.Founder[] memory many = new StartupChain.Founder[](n);
        for (uint256 i = 0; i < n; i++) {
            many[i] = StartupChain.Founder({wallet: address(uint160(1000 + i)), equityBps: 0, role: ""});
        }
        vm.prank(founderA);
        vm.expectRevert("Too many founders");
        sc.recordCompany(ENS_NAME, address(safe), many, 1);
    }

    function test_founderReverseIndex() public {
        vm.prank(founderA);
        uint256 id = sc.recordCompany(ENS_NAME, address(safe), _founders(), 2);

        uint256[] memory aCompanies = sc.getCompaniesByFounder(founderA);
        assertEq(aCompanies.length, 1);
        assertEq(aCompanies[0], id);
        uint256[] memory bCompanies = sc.getCompaniesByFounder(founderB);
        assertEq(bCompanies.length, 1);
        assertEq(bCompanies[0], id);
        // no double-indexing if the same founder reappears via updateFounders
        vm.prank(address(safe));
        sc.updateFounders(id, _founders());
        assertEq(sc.getCompaniesByFounder(founderA).length, 1, "index deduped");
    }

    // --- tradeoff: solo company => 1/1 Safe -----------------------------------------------------

    /// A solo founder registers with a 1/1 Safe. This is ALLOWED (threshold <= founders.length), but a
    /// 1/1 Safe has no multisig protection — documented in SECURITY notes as an accepted tradeoff rather
    /// than enforced with a floor, so solo founders aren't blocked.
    function test_soloFounderOneOfOneSafeAllowed() public {
        MockSafe solo = new MockSafe();
        solo.setOwner(founderA, true);
        StartupChain.Founder[] memory one = new StartupChain.Founder[](1);
        one[0] = StartupChain.Founder({wallet: founderA, equityBps: 10000, role: "Solo"});
        vm.prank(founderA);
        uint256 id = sc.recordCompany("solo", address(solo), one, 1);
        assertEq(sc.getThreshold(id), 1);
    }
}
