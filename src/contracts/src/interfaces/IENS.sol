// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IENS {
    function resolver(bytes32 node) external view returns (address);
    function owner(bytes32 node) external view returns (address);
    function setOwner(bytes32 node, address owner) external;
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external;
    function setResolver(bytes32 node, address resolver) external;
    function setTTL(bytes32 node, uint64 ttl) external;
}

interface IENSResolver {
    function setAddr(bytes32 node, address addr) external;
    function addr(bytes32 node) external view returns (address);
}
