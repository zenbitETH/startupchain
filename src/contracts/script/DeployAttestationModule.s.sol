// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {AttestationModule} from "../src/AttestationModule.sol";

contract DeployAttestationModule is Script {
    // EAS contract addresses
    // Mainnet: 0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587
    // Sepolia: 0xC2679fBD37d54388Ce493F1DB75320D236e1815e
    
    function run() public {
        uint256 chainId = block.chainid;
        
        address easAddress;
        if (chainId == 1) {
            // Mainnet
            easAddress = 0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587;
        } else if (chainId == 11155111) {
            // Sepolia
            easAddress = 0xC2679fBD37d54388Ce493F1DB75320D236e1815e;
        } else {
            revert("Unsupported chain");
        }

        // StartupChain registry address (update this after deployment or pass via env)
        address startupChainRegistry = vm.envOr(
            "STARTUPCHAIN_ADDRESS",
            address(0x4511d1d2B9C1BBA33D1B25c3E547835b5BA1F3aC) // Sepolia default
        );

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying AttestationModule with deployer:", deployer);
        console.log("EAS address:", easAddress);
        console.log("StartupChain registry:", startupChainRegistry);
        console.log("Chain ID:", chainId);

        vm.startBroadcast(deployerPrivateKey);

        AttestationModule attestationModule = new AttestationModule(
            easAddress,
            startupChainRegistry
        );

        console.log("AttestationModule deployed at:", address(attestationModule));

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("Contract Address:", address(attestationModule));
        console.log("\nUpdate your config with:");
        console.log("ATTESTATION_MODULE_ADDRESS=", address(attestationModule));
        console.log("\n=== Next Steps ===");
        console.log("1. Register EAS schemas at https://sepolia.easscan.org/schema/create");
        console.log("2. Call setCompanyFormationSchema() with the schema UID");
        console.log("3. Repeat for other attestation types");
    }
}
