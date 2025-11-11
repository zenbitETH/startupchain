// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {CompanyToken} from "../src/CompanyToken.sol";

contract CompanyTokenTest is Test {
    CompanyToken public token;

    address public admin = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    uint256 public constant COMPANY_ID = 1;
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;

    function setUp() public {
        token = new CompanyToken(
            "TestCompany Token",
            "TCT",
            COMPANY_ID,
            address(this),
            INITIAL_SUPPLY,
            admin
        );
    }

    function testInitialState() public view {
        assertEq(token.name(), "TestCompany Token");
        assertEq(token.symbol(), "TCT");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(admin), INITIAL_SUPPLY);
        assertFalse(token.transfersEnabled());
    }

    function testAdminHasRoles() public view {
        assertTrue(token.hasRole(token.ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(token.MINTER_ROLE(), admin));
        assertTrue(token.hasRole(token.BURNER_ROLE(), admin));
    }

    function testGrantRole() public {
        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), user1);
        vm.stopPrank();

        assertTrue(token.hasRole(token.MINTER_ROLE(), user1));
    }

    function testRevokeRole() public {
        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), user1);
        token.revokeRole(token.MINTER_ROLE(), user1);
        vm.stopPrank();

        assertFalse(token.hasRole(token.MINTER_ROLE(), user1));
    }

    function testOnlyAdminCanGrantRole() public {
        bytes32 minterRole = token.MINTER_ROLE();
        vm.prank(user1);
        vm.expectRevert("Caller does not have required role");
        token.grantRole(minterRole, user2);
    }

    function testMint() public {
        vm.prank(admin);
        token.mint(user1, 1000 * 10**18);

        assertEq(token.balanceOf(user1), 1000 * 10**18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + 1000 * 10**18);
    }

    function testOnlyMinterCanMint() public {
        vm.prank(user1);
        vm.expectRevert("Caller does not have required role");
        token.mint(user2, 1000 * 10**18);
    }

    function testBurn() public {
        vm.prank(admin);
        token.burn(100 * 10**18);

        assertEq(token.balanceOf(admin), INITIAL_SUPPLY - 100 * 10**18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - 100 * 10**18);
    }

    function testBurnFrom() public {
        vm.prank(admin);
        token.burnFrom(admin, 100 * 10**18);

        assertEq(token.balanceOf(admin), INITIAL_SUPPLY - 100 * 10**18);
    }

    function testTransfersDisabledByDefault() public {
        vm.prank(admin);
        vm.expectRevert("Transfers are disabled");
        token.transfer(user1, 1000 * 10**18);
    }

    function testEnableTransfers() public {
        vm.prank(admin);
        token.enableTransfers();

        assertTrue(token.transfersEnabled());
    }

    function testTransferWhenEnabled() public {
        vm.prank(admin);
        token.enableTransfers();

        vm.prank(admin);
        token.transfer(user1, 1000 * 10**18);

        assertEq(token.balanceOf(user1), 1000 * 10**18);
        assertEq(token.balanceOf(admin), INITIAL_SUPPLY - 1000 * 10**18);
    }

    function testWhitelistedTransfer() public {
        vm.prank(admin);
        token.addToWhitelist(admin);

        vm.prank(admin);
        token.transfer(user1, 1000 * 10**18);

        assertEq(token.balanceOf(user1), 1000 * 10**18);
    }

    function testAddToWhitelist() public {
        vm.prank(admin);
        token.addToWhitelist(user1);

        assertTrue(token.transferWhitelist(user1));
    }

    function testRemoveFromWhitelist() public {
        vm.prank(admin);
        token.addToWhitelist(user1);

        vm.prank(admin);
        token.removeFromWhitelist(user1);

        assertFalse(token.transferWhitelist(user1));
    }

    function testApproveAndTransferFrom() public {
        vm.prank(admin);
        token.enableTransfers();

        vm.prank(admin);
        token.approve(user1, 1000 * 10**18);

        assertEq(token.allowance(admin, user1), 1000 * 10**18);

        vm.prank(user1);
        token.transferFrom(admin, user2, 500 * 10**18);

        assertEq(token.balanceOf(user2), 500 * 10**18);
        assertEq(token.allowance(admin, user1), 500 * 10**18);
    }

    function testCreateVestingSchedule() public {
        uint256 amount = 1000 * 10**18;
        uint256 startTime = block.timestamp;
        uint256 cliffDuration = 365 days;
        uint256 duration = 4 * 365 days;

        vm.prank(admin);
        token.createVestingSchedule(
            user1,
            amount,
            startTime,
            cliffDuration,
            duration,
            false
        );

        (
            uint256 totalAmount,
            uint256 released,
            uint256 vestingStartTime,
            uint256 vestingCliffDuration,
            uint256 vestingDuration,
            bool revocable,
            bool revoked
        ) = token.vestingSchedules(user1);

        assertEq(totalAmount, amount);
        assertEq(released, 0);
        assertEq(vestingStartTime, startTime);
        assertEq(vestingCliffDuration, cliffDuration);
        assertEq(vestingDuration, duration);
        assertFalse(revocable);
        assertFalse(revoked);
    }

    function testCannotReleaseTokensBeforeCliff() public {
        uint256 amount = 1000 * 10**18;
        uint256 startTime = block.timestamp;
        uint256 cliffDuration = 365 days;
        uint256 duration = 4 * 365 days;

        vm.prank(admin);
        token.createVestingSchedule(
            user1,
            amount,
            startTime,
            cliffDuration,
            duration,
            false
        );

        // Try to release before cliff
        vm.prank(user1);
        vm.expectRevert("No tokens to release");
        token.releaseVestedTokens();
    }

    function testReleaseVestedTokens() public {
        uint256 amount = 1000 * 10**18;
        uint256 startTime = block.timestamp;
        uint256 cliffDuration = 365 days;
        uint256 duration = 4 * 365 days;

        vm.prank(admin);
        token.createVestingSchedule(
            user1,
            amount,
            startTime,
            cliffDuration,
            duration,
            false
        );

        // Fast forward past cliff
        vm.warp(block.timestamp + cliffDuration + 1 days);

        vm.prank(user1);
        token.releaseVestedTokens();

        assertTrue(token.balanceOf(user1) > 0);
    }

    function testGetVestedAmount() public {
        uint256 amount = 1000 * 10**18;
        uint256 startTime = block.timestamp;
        uint256 cliffDuration = 0;
        uint256 duration = 365 days;

        vm.prank(admin);
        token.createVestingSchedule(
            user1,
            amount,
            startTime,
            cliffDuration,
            duration,
            false
        );

        // Fast forward halfway through vesting
        vm.warp(block.timestamp + duration / 2);

        uint256 vested = token.getVestedAmount(user1);
        assertApproxEqRel(vested, amount / 2, 0.01e18); // Within 1%
    }

    function testRevokeVesting() public {
        uint256 amount = 1000 * 10**18;
        uint256 startTime = block.timestamp;
        uint256 cliffDuration = 0;
        uint256 duration = 365 days;

        vm.prank(admin);
        token.createVestingSchedule(
            user1,
            amount,
            startTime,
            cliffDuration,
            duration,
            true // revocable
        );

        vm.prank(admin);
        token.revokeVesting(user1);

        (, , , , , , bool revoked) = token.vestingSchedules(user1);
        assertTrue(revoked);
    }

    function testCannotRevokeNonRevocableVesting() public {
        uint256 amount = 1000 * 10**18;
        uint256 startTime = block.timestamp;
        uint256 cliffDuration = 0;
        uint256 duration = 365 days;

        vm.prank(admin);
        token.createVestingSchedule(
            user1,
            amount,
            startTime,
            cliffDuration,
            duration,
            false // not revocable
        );

        vm.prank(admin);
        vm.expectRevert("Vesting not revocable");
        token.revokeVesting(user1);
    }

    function testDisableTransfers() public {
        vm.prank(admin);
        token.enableTransfers();

        vm.prank(admin);
        token.disableTransfers();

        assertFalse(token.transfersEnabled());
    }
}
