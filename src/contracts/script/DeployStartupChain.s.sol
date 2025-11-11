// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {StartupChain} from "../src/StartupChain.sol";
import {GovernanceWrapper} from "../src/GovernanceWrapper.sol";
import {AttestationModule} from "../src/AttestationModule.sol";
import {CompanyToken} from "../src/CompanyToken.sol";

contract DeployStartupChain is Script {
    // Network-specific addresses (update these for each network)
    struct NetworkConfig {
        address ensRegistry;
        address ensRegistrar;
        address ensResolver;
        address easAddress;
    }

    function getNetworkConfig() internal view returns (NetworkConfig memory) {
        uint256 chainId = block.chainid;

        // Ethereum Mainnet
        if (chainId == 1) {
            return NetworkConfig({
                ensRegistry: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e,
                ensRegistrar: 0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5, // ETH Registrar Controller
                ensResolver: 0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41, // Public Resolver
                easAddress: 0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587 // EAS mainnet
            });
        }
        // Sepolia Testnet
        else if (chainId == 11155111) {
            return NetworkConfig({
                ensRegistry: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e,
                ensRegistrar: 0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72, // ETH Registrar Controller (Sepolia)
                ensResolver: 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD, // Public Resolver (Sepolia)
                easAddress: 0xC2679fBD37d54388Ce493F1DB75320D236e1815e // EAS Sepolia
            });
        }
        // Optimism Mainnet
        else if (chainId == 10) {
            return NetworkConfig({
                ensRegistry: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e,
                ensRegistrar: address(0), // ENS not natively supported on OP, use L1
                ensResolver: address(0),
                easAddress: 0x4200000000000000000000000000000000000021 // EAS on OP Mainnet
            });
        }
        // Optimism Sepolia
        else if (chainId == 11155420) {
            return NetworkConfig({
                ensRegistry: address(0),
                ensRegistrar: address(0),
                ensResolver: address(0),
                easAddress: 0x4200000000000000000000000000000000000021 // EAS on OP Sepolia
            });
        }
        // Base Mainnet
        else if (chainId == 8453) {
            return NetworkConfig({
                ensRegistry: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e,
                ensRegistrar: address(0),
                ensResolver: address(0),
                easAddress: 0x4200000000000000000000000000000000000021 // EAS on Base
            });
        }
        // Base Sepolia
        else if (chainId == 84532) {
            return NetworkConfig({
                ensRegistry: address(0),
                ensRegistrar: address(0),
                ensResolver: address(0),
                easAddress: 0x4200000000000000000000000000000000000021 // EAS on Base Sepolia
            });
        }
        // Local/Anvil - use mock addresses
        else {
            console.log("Warning: Using mock addresses for local deployment");
            return NetworkConfig({
                ensRegistry: address(0),
                ensRegistrar: address(0),
                ensResolver: address(0),
                easAddress: address(0)
            });
        }
    }

    function run() public {
        NetworkConfig memory config = getNetworkConfig();

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy StartupChain Registry
        StartupChain startupChain = new StartupChain(
            config.ensRegistry,
            config.ensRegistrar,
            config.ensResolver
        );
        console.log("StartupChain deployed at:", address(startupChain));

        // Deploy GovernanceWrapper
        GovernanceWrapper governance = new GovernanceWrapper(address(startupChain));
        console.log("GovernanceWrapper deployed at:", address(governance));

        // Deploy AttestationModule
        AttestationModule attestationModule = new AttestationModule(
            config.easAddress,
            address(startupChain)
        );
        console.log("AttestationModule deployed at:", address(attestationModule));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Chain ID", block.chainid);
        console.log("Deployer:", deployer);
        console.log("\nContract Addresses:");
        console.log("  StartupChain:", address(startupChain));
        console.log("  GovernanceWrapper:", address(governance));
        console.log("  AttestationModule:", address(attestationModule));
        console.log("\nIntegrations:");
        console.log("  ENS Registry:", config.ensRegistry);
        console.log("  ENS Registrar:", config.ensRegistrar);
        console.log("  ENS Resolver:", config.ensResolver);
        console.log("  EAS:", config.easAddress);
        console.log("\nNext Steps:");
        console.log("1. Set up EAS schemas for attestations");
        console.log("2. Configure governance parameters");
        console.log("3. Update frontend with contract addresses");
    }
}
