# Implementation Plan: ENSWizard-contracts

**Status:** Ready for Development
**Epic:** B (ENS Wizard & Contract Writes)
**Target Audience:** Junior Developer

## 🎯 Goal: "One-Click" ENS & Company Registration
We are simplifying the user experience to a "Fire and Forget" model. The user pays once, and we handle the complex ENS registration (Commit -> Wait -> Register) and Company creation on the backend.

**The User Flow:**
1.  **Check:** User types ENS name -> We check availability & calculate cost (ENS Fee + Gas + Service Fee).
2.  **Pay:** User clicks "Register & Create" -> Signs **one** transaction to pay us.
3.  **Done:** User sees "Registration in Progress". We handle the rest and notify them when finished.

## Prerequisites
- [x] Epic A Complete (Auth, Providers, Middleware)
- [x] `src/lib/blockchain/startupchain-client.ts` exists
- [x] `src/contracts/src/StartupChain.sol` exists

## Step-by-Step Implementation Guide

### Step 1: Refactor Smart Contract (`StartupChain.sol`)
**File:** `src/contracts/src/StartupChain.sol`

We need a "Cashier" function to accept payment and queue the job.

1.  **Add `requestRegistration` Function:**
    ```solidity
    event RegistrationRequested(uint256 indexed requestId, string ensName, address indexed owner, address[] founders);

    function requestRegistration(string memory _ensName, address[] memory _founders) external payable {
        // 1. Calculate required cost (ENS price + Gas buffer + Fee) - For MVP, just check msg.value > MinPrice
        require(msg.value >= 0.01 ether, "Insufficient payment"); // Example threshold

        // 2. Emit event for the Backend to pick up
        emit RegistrationRequested(nextRequestId++, _ensName, msg.sender, _founders);

        // 3. Store funds in contract (to be used by Operator or withdrawn to Treasury)
    }
    ```
2.  **Update `registerCompany` Function:**
    *   **Access Control:** Only callable by the `owner` (our Server/Operator wallet).
    *   **Logic:** Creates the Company struct and assigns it to the `_owner` (the user who paid).

### Step 2: Backend "Worker" Service
**File:** `src/app/api/cron/process-registrations/route.ts` (or a standalone script)

This is the engine that does the work while the user waits.

1.  **Trigger:** Polls for `RegistrationRequested` events (or use a webhook like Alchemy Notify).
2.  **Process (The "ENS Dance"):**
    *   **Commit:** Server wallet calls ENS `makeCommitment`.
    *   **Wait:** Server waits 60 seconds.
    *   **Register:** Server wallet calls ENS `register`. **Crucial:** Register the name *to the User's address*, not the Server's.
    *   **Finalize:** Server wallet calls `StartupChain.registerCompany(ensName, founders, userAddress)`.
3.  **Notification:** (Optional for MVP) Send email/SMS via Twilio/Resend.

### Step 3: Update Frontend Wizard
**File:** `src/app/(app)/dashboard/setup/components/setup-wizzard.tsx`

1.  **Cost Calculation:**
    *   Use `useEnsCost` hook to estimate the total price.
    *   Add a "Service Fee" (e.g., 10%).
2.  **Payment Action:**
    *   Replace the multi-step flow with a single `writeContract` call to `StartupChain.requestRegistration`.
    *   Send the calculated ETH value.
3.  **Success State:**
    *   Show a "Registration Started" screen.
    *   "We are securing your name. This takes about 2-3 minutes. You can close this page."

### Step 4: Blockchain Client Update
**File:** `src/lib/blockchain/startupchain-client.ts`

1.  **Operator Wallet:** Ensure the server has a funded wallet (`STARTUPCHAIN_SIGNER_KEY`) to execute the backend steps.

## ⚠️ Technical Feasibility & Challenges
We have verified that this flow is possible using Viem/Wagmi and standard ENS contracts.

1.  **Can we register for others?**
    *   **Yes.** The ENS `ETHRegistrarController.register` function accepts an `owner` parameter. The Server (Operator) pays the gas/ETH, but the User becomes the owner.
2.  **Gas/Price Volatility:**
    *   *Risk:* Gas prices spike during the 60s wait, making the user's payment insufficient.
    *   *Solution:* Charge a **buffer** (e.g., +20%) upfront.
3.  **Scaling & Nonce Management (1000+ RPS):**
    *   *The Bottleneck:* A single Ethereum account cannot send parallel transactions; they must be ordered sequentially (Nonce 1, 2, 3...). If Nonce 1 is stuck, Nonce 2 waits.
    *   *MVP Solution:* A simple Redis/Database queue processed by one worker.
    *   *Scaling Solution:* To handle high throughput, we will implement a **Wallet Pool** (e.g., 20+ Operator Wallets) or use a **Relayer Service** (like Gelato or OpenZeppelin Defender) to broadcast transactions in parallel.
4.  **Privy vs. Private Key:**
    *   For MVP, we will use a standard **Private Key** (stored in env vars) for the Operator Wallet.
    *   Later, we can upgrade to **Privy Server Wallets** for better key management (HSM), but the logic remains the same.
