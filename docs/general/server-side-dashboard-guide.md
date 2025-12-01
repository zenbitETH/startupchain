# Server-Side Dashboard Implementation Guide

This guide outlines the steps to refactor the dashboard to use Server Components for data fetching, ensuring a faster and more secure user experience.

## 1. Expose Public Client
**File:** `src/lib/blockchain/startupchain-client.ts`

We need a `publicClient` to read from the blockchain on the server without a signer.

```typescript
import { createPublicClient, http } from 'viem'
// ... existing imports

// ... existing code ...

export const publicClient = createPublicClient({
  chain: target.chain,
  transport: http(target.rpcUrl)
})
```

## 2. Create Company Fetcher
**File:** `src/lib/blockchain/get-company.ts` (New File)

This helper function isolates the logic for reading company data from the `StartupChain` contract.

```typescript
import { publicClient } from './startupchain-client'
// Import ABI (you might need to export it or read it from the JSON file)
// import StartupChainAbi from '@/lib/abis/StartupChain.json'

const STARTUPCHAIN_ADDRESS = process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS as `0x${string}`

export async function getCompanyByAddress(address: string) {
  if (!address) return null

  try {
    // Call the contract's getCompanyByAddress function
    // Note: Adjust the function name/ABI based on your actual contract
    const data = await publicClient.readContract({
      address: STARTUPCHAIN_ADDRESS,
      abi: [/* Minimal ABI for getCompanyByAddress */],
      functionName: 'getCompanyByAddress',
      args: [address],
    })

    return data
  } catch (error) {
    // Contract throws if no company found, so return null
    return null
  }
}
```

## 3. Refactor Dashboard Page
**File:** `src/app/(app)/dashboard/page.tsx`

Convert the dashboard to an `async` Server Component.

```typescript
import { getServerSession } from '@/lib/auth/server-session'
import { getCompanyByAddress } from '@/lib/blockchain/get-company'
import { DashboardCompanyInfo } from './components/dashboard-company-info' // You'll create this
import { DashboardEmptyState } from './components/dashboard-empty-state' // You'll create this

export default async function Dashboard() {
  // 1. Get Session (and Wallet Address)
  const session = await getServerSession()

  if (!session || !session.walletAddress) {
    // Handle no wallet (redirect or show connect prompt)
    return <div>Please connect your wallet</div>
  }

  // 2. Fetch Company Data
  const company = await getCompanyByAddress(session.walletAddress)

  // 3. Render
  if (company) {
    return <DashboardCompanyInfo company={company} />
  } else {
    return <DashboardEmptyState />
  }
}
```

## 4. Extract Client Interactivity
**Files:**
- `src/app/(app)/dashboard/components/dashboard-empty-state.tsx`: Move the ENS search and Wizard trigger here.
- `src/app/(app)/dashboard/components/dashboard-company-info.tsx`: Display the fetched company details.

This separation ensures that the heavy interactive logic (wizard, forms) is only loaded when needed (Client Components), while the main data display is instant (Server Component).

## 5. The "Write" Flow (Wizard)
Since Server Components cannot sign transactions (they don't have the user's private key), the **Wizard remains a Client Component**.

**The Flow:**
1.  **User Interaction:** User fills out the form in `<SetupWizard />` (Client Component).
2.  **Transaction:** User clicks "Register". The component uses `wagmi` hooks (`useWriteContract`) to request a signature from the user's wallet (Metamask or Privy Embedded).
3.  **Blockchain Write:** The wallet signs and broadcasts the transaction to the `StartupChain` contract.
4.  **Confirmation:** The Wizard waits for the transaction receipt (`useWaitForTransactionReceipt`).
5.  **Refresh:** Upon success, the Wizard calls `router.refresh()`.
6.  **Update:** This triggers the **Server Component** (Dashboard) to re-fetch data. Since the contract state has changed, `getCompanyByAddress` now returns the new company, and the UI updates to show `<DashboardCompanyInfo />`.
