# AI Deployment Guide for StartupChain

This guide provides instructions for AI agents to deploy and verify the StartupChain smart contracts.

## Prerequisites

Ensure the `.env` file in the project root is populated with the following:

- `SEPOLIA_RPC_URL`: RPC URL for the Sepolia testnet.
- `DEPLOYER_KEY`: Private key of the deployer account (must have Sepolia ETH).
- `ETHERSCAN_API_KEY`: API key for Etherscan verification.

## 1. Deploy StartupChain Contract

The `StartupChain` contract is the core registry.

**Command:**

```bash
cd src/contracts && \
ln -sf ../../.env .env && \
forge script script/DeployStartupChain.s.sol:DeployStartupChain \
  --rpc-url $(grep SEPOLIA_RPC_URL .env | cut -d '"' -f2) \
  --broadcast
```

**Post-Deployment:**

1.  **Extract Address:** Look for "Contract Address:" in the output logs.
2.  **Update .env:** Update `NEXT_PUBLIC_STARTUPCHAIN_ADDRESS` and `NEXT_PUBLIC_STARTUPCHAIN_ADDRESS_SEPOLIA` in the root `.env` file with the new address.

## 2. Verify StartupChain Contract

Verification ensures the contract source code is visible on Etherscan.

**Command:**

```bash
cd src/contracts && \
./scripts/verify-startupchain.sh
```

**Note:** This script automatically reads the contract address from the `.env` file (specifically `NEXT_PUBLIC_STARTUPCHAIN_ADDRESS_SEPOLIA` or `NEXT_PUBLIC_STARTUPCHAIN_ADDRESS`).

## 3. Deploy CompanyToken (Optional/Per-Company)

The `CompanyToken` is deployed for individual companies. This is typically done programmatically by the `StartupChain` contract or backend, but can be deployed manually for testing.

**Required Environment Variables (set temporarily or in `.env`):**

- `TOKEN_NAME`: Name of the token.
- `TOKEN_SYMBOL`: Symbol of the token.
- `COMPANY_ID`: ID of the company in the registry.
- `STARTUP_CHAIN_ADDRESS`: Address of the deployed `StartupChain` contract.
- `INITIAL_SUPPLY`: Initial token supply (in wei).
- `TOKEN_ADMIN`: Address of the token admin.

**Command:**

```bash
cd src/contracts && \
ln -sf ../../.env .env && \
forge script script/DeployCompanyToken.s.sol:DeployCompanyToken \
  --rpc-url $(grep SEPOLIA_RPC_URL .env | cut -d '"' -f2) \
  --broadcast
```

## Troubleshooting

-   **"environment variable not found":** Ensure you are running the command from `src/contracts` and that the `.env` symlink exists (`ln -sf ../../.env .env`).
-   **"missing hex prefix":** Ensure private keys in `.env` start with `0x`.
-   **"nonce too low":** The deployer account has pending transactions. Wait or replace the transaction.
-   **Verification fails:** Ensure `ETHERSCAN_API_KEY` is correct and wait a few minutes after deployment before verifying.
