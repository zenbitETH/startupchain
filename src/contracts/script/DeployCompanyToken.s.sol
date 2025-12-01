// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {CompanyToken} from "../src/CompanyToken.sol";

contract DeployCompanyToken is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Configuration from environment or hardcoded for testing
        string memory tokenName = vm.envOr("TOKEN_NAME", string("Company Token"));
        string memory tokenSymbol = vm.envOr("TOKEN_SYMBOL", string("CMPY"));
        uint256 companyId = vm.envOr("COMPANY_ID", uint256(1));
        address startupChainRegistry = vm.envAddress("STARTUP_CHAIN_ADDRESS");
        uint256 initialSupply = vm.envOr("INITIAL_SUPPLY", uint256(1000000 * 10**18));
        address admin = vm.envOr("TOKEN_ADMIN", deployer);

        console.log("Deploying CompanyToken with deployer:", deployer);
        console.log("Token Name:", tokenName);
        console.log("Token Symbol:", tokenSymbol);
        console.log("Company ID:", companyId);
        console.log("Admin:", admin);

        vm.startBroadcast(deployerPrivateKey);

        CompanyToken token = new CompanyToken(
            tokenName,
            tokenSymbol,
            companyId,
            startupChainRegistry,
            initialSupply,
            admin
        );

        console.log("CompanyToken deployed at:", address(token));
        console.log("Total Supply:", token.totalSupply());
        console.log("Admin Balance:", token.balanceOf(admin));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Token Address:", address(token));
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Decimals:", token.decimals());
        console.log("Total Supply:", token.totalSupply());
        console.log("Admin:", admin);
        console.log("\nNext Steps:");
        console.log("1. Enable transfers if needed: token.enableTransfers()");
        console.log("2. Add addresses to whitelist if needed");
        console.log("3. Grant roles to additional addresses if needed");
    }
}
