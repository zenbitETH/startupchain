// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {StartupChain} from "../src/StartupChain.sol";

contract DeployStartupChain is Script {
    function run() public {
        // Sepolia ENS addresses
        address ensRegistry = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
        address ensRegistrar = 0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72;
        address ensResolver = 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD;

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Fee recipient is the deployer (treasury)
        address feeRecipient = deployer;

        console.log("Deploying StartupChain with deployer:", deployer);
        console.log("Fee recipient:", feeRecipient);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        StartupChain startupChain = new StartupChain(
            ensRegistry,
            ensRegistrar,
            ensResolver,
            feeRecipient
        );

        console.log("StartupChain deployed at:", address(startupChain));

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("Contract Address:", address(startupChain));
        console.log("\nUpdate your .env with:");
        console.log("NEXT_PUBLIC_STARTUPCHAIN_ADDRESS_SEPOLIA=", address(startupChain));
    }
}
