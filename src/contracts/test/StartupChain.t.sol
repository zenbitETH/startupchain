// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {StartupChain} from "../src/StartupChain.sol";
import {IENS, IENSResolver, IENSRegistrar} from "../src/interfaces/IENS.sol";

contract MockENSRegistry is IENS {
    mapping(bytes32 => address) public owners;
    mapping(bytes32 => address) public resolvers;

    function owner(bytes32 node) external view returns (address) {
        return owners[node];
    }

    function resolver(bytes32 node) external view returns (address) {
        return resolvers[node];
    }

    function setOwner(bytes32 node, address _owner) external {
        owners[node] = _owner;
    }

    function setSubnodeOwner(bytes32 node, bytes32 label, address _owner) external {
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        owners[subnode] = _owner;
    }

    function setResolver(bytes32 node, address _resolver) external {
        resolvers[node] = _resolver;
    }

    function setTTL(bytes32 node, uint64 ttl) external {}
}

contract MockENSResolver is IENSResolver {
    mapping(bytes32 => address) public addresses;

    function setAddr(bytes32 node, address _addr) external {
        addresses[node] = _addr;
    }

    function addr(bytes32 node) external view returns (address) {
        return addresses[node];
    }
}

contract MockENSRegistrar is IENSRegistrar {
    mapping(bytes32 => bool) public registeredNames;

    function register(bytes32 label, address _owner) external {
        registeredNames[label] = true;
    }

    function available(bytes32 label) external view returns (bool) {
        return !registeredNames[label];
    }
}

contract StartupChainTest is Test {
    StartupChain public startupChain;
    MockENSRegistry public ensRegistry;
    MockENSRegistrar public ensRegistrar;
    MockENSResolver public ensResolver;

    address public owner = address(1);
    address public founder1 = address(2);
    address public founder2 = address(3);
    address public nonOwner = address(4);

    function setUp() public {
        ensRegistry = new MockENSRegistry();
        ensRegistrar = new MockENSRegistrar();
        ensResolver = new MockENSResolver();

        startupChain = new StartupChain(
            address(ensRegistry),
            address(ensRegistrar),
            address(ensResolver)
        );
    }

    function testRegisterCompany() public {
        address[] memory founders = new address[](2);
        founders[0] = founder1;
        founders[1] = founder2;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        assertEq(companyId, 1);
        assertEq(startupChain.getTotalCompanies(), 1);

        (
            uint256 id,
            address companyAddress,
            string memory ensName,
            ,
            address[] memory returnedFounders
        ) = startupChain.getCompany(companyId);

        assertEq(id, companyId);
        assertEq(companyAddress, owner);
        assertEq(ensName, "testcompany");
        assertEq(returnedFounders.length, 2);
        assertEq(returnedFounders[0], founder1);
        assertEq(returnedFounders[1], founder2);
    }

    function testCannotRegisterCompanyTwice() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.startPrank(owner);
        startupChain.registerCompany("company1", founders);

        vm.expectRevert("Company already registered for this address");
        startupChain.registerCompany("company2", founders);
        vm.stopPrank();
    }

    function testCannotRegisterWithDuplicateENSName() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        startupChain.registerCompany("testcompany", founders);

        vm.prank(nonOwner);
        vm.expectRevert("ENS name already taken");
        startupChain.registerCompany("testcompany", founders);
    }

    function testCreateSubdomain() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        vm.prank(owner);
        startupChain.createSubdomain(companyId, "john", founder1);

        (
            string memory name,
            address subdomainOwner,
            uint256 createdAt,
            bool active
        ) = startupChain.getSubdomain(companyId, "john");

        assertEq(name, "john");
        assertEq(subdomainOwner, founder1);
        assertTrue(active);
        assertGt(createdAt, 0);
    }

    function testCannotCreateDuplicateSubdomain() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        vm.prank(owner);
        startupChain.createSubdomain(companyId, "john", founder1);

        vm.prank(owner);
        vm.expectRevert("Subdomain already exists");
        startupChain.createSubdomain(companyId, "john", founder2);
    }

    function testRevokeSubdomain() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        vm.prank(owner);
        startupChain.createSubdomain(companyId, "john", founder1);

        vm.prank(owner);
        startupChain.revokeSubdomain(companyId, "john");

        (,,, bool active) = startupChain.getSubdomain(companyId, "john");
        assertFalse(active);
    }

    function testSetSafeAddress() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        address safeAddress = address(0x123);
        vm.prank(owner);
        startupChain.setSafeAddress(companyId, safeAddress);

        assertEq(startupChain.getSafeAddress(companyId), safeAddress);
    }

    function testSetGovernanceAddress() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        address governanceAddress = address(0x456);
        vm.prank(owner);
        startupChain.setGovernanceAddress(companyId, governanceAddress);

        assertEq(startupChain.getGovernanceAddress(companyId), governanceAddress);
    }

    function testOnlyOwnerCanCreateSubdomain() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        vm.prank(nonOwner);
        vm.expectRevert("Only company owner can create subdomains");
        startupChain.createSubdomain(companyId, "john", founder1);
    }

    function testGetCompanyByAddress() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        (uint256 id, address companyAddress, string memory ensName,,) =
            startupChain.getCompanyByAddress(owner);

        assertEq(id, companyId);
        assertEq(companyAddress, owner);
        assertEq(ensName, "testcompany");
    }

    function testGetCompanyByENS() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        (uint256 id, address companyAddress, string memory ensName,,) =
            startupChain.getCompanyByENS("testcompany");

        assertEq(id, companyId);
        assertEq(companyAddress, owner);
        assertEq(ensName, "testcompany");
    }

    function testGetCompanySubdomains() public {
        address[] memory founders = new address[](1);
        founders[0] = founder1;

        vm.prank(owner);
        uint256 companyId = startupChain.registerCompany("testcompany", founders);

        vm.startPrank(owner);
        startupChain.createSubdomain(companyId, "john", founder1);
        startupChain.createSubdomain(companyId, "jane", founder2);
        vm.stopPrank();

        string[] memory subdomains = startupChain.getCompanySubdomains(companyId);
        assertEq(subdomains.length, 2);
        assertEq(subdomains[0], "john");
        assertEq(subdomains[1], "jane");
    }
}
