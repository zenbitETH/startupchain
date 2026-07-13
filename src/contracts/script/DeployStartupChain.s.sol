// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {StartupChain} from "../src/StartupChain.sol";

contract DeployStartupChain is Script {
    function run() public {
        // Sepolia ENS addresses
        // Note: ensRegistrar removed - ENS registration is handled off-chain via server actions
        address ensRegistry = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
        address ensResolver = 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD;

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // #2/#8 — owner should be a 2/3 Safe; fee recipient (treasury) should be SEPARATE from the hot
        // signer. Both default to the deployer only if not provided (loudly, for local dev).
        address initialOwner = vm.envOr("STARTUPCHAIN_OWNER", deployer);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);

        console.log("Deploying StartupChain with deployer:", deployer);
        console.log("Owner (should be a 2/3 Safe):", initialOwner);
        console.log("Fee recipient (treasury):", feeRecipient);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        StartupChain startupChain = new StartupChain(
            ensRegistry,
            ensResolver,
            feeRecipient,
            initialOwner
        );

        console.log("StartupChain deployed at:", address(startupChain));

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("Contract Address:", address(startupChain));
        console.log("\nUpdate your .env with:");
        console.log("NEXT_PUBLIC_STARTUPCHAIN_ADDRESS_SEPOLIA=", address(startupChain));
    }
}
