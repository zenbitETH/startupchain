// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {StartupChainSimple} from "../src/StartupChainSimple.sol";

contract DeploySimple is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying StartupChainSimple with deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy with deployer as fee recipient
        StartupChainSimple startupChain = new StartupChainSimple(deployer);

        console.log("StartupChainSimple deployed at:", address(startupChain));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Contract:", address(startupChain));
        console.log("Fee Recipient:", deployer);
        console.log("\nAdd to .env:");
        console.log("NEXT_PUBLIC_STARTUPCHAIN_ADDRESS=", address(startupChain));
    }
}
