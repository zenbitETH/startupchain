import { ExternalLink } from 'lucide-react'
import { cookies } from 'next/headers'

import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'
import { getServerSession } from '@/lib/auth/server-session'
import { getCompanyByFounderWallet } from '@/lib/blockchain/get-company'
import { getSafeDashboardData } from '@/lib/blockchain/safe-api'
import { STARTUPCHAIN_CHAIN_ID } from '@/lib/blockchain/startupchain-config'
import { formatEth } from '@/lib/utils'

import {
  SafeDetailsCard,
  SafeEmptyState,
  SafeOverviewCards,
  SafeOwnersCard,
  SafePendingTransactions,
  SafeTokenBalances,
  SafeTransactionHistory,
} from './components'

const explorerBase =
  STARTUPCHAIN_CHAIN_ID === 1
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io'

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Pending'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function SafeDashboardPage() {
  const cookieStore = await cookies()
  const session = await getServerSession({ cookies: cookieStore })
  const walletAddress = session?.walletAddress

  // Get company data to find Safe address
  const company = walletAddress
    ? await getCompanyByFounderWallet(walletAddress)
    : null

  const safeAddress = company?.safeAddress

  // Fetch Safe data if we have a Safe address
  const safeData = safeAddress
    ? await getSafeDashboardData(safeAddress, STARTUPCHAIN_CHAIN_ID)
    : null

  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="Multichain Safe" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your company&apos;s multisig treasury. View balances,
              owners, and pending transactions.
            </p>
          </div>
          {safeData?.safeWalletUrl && (
            <a
              href={safeData.safeWalletUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              Open Safe{'{Wallet}'}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {!safeAddress ? (
          <SafeEmptyState type="no-safe" />
        ) : !safeData?.info ? (
          <SafeEmptyState
            type="not-indexed"
            safeAddress={safeAddress}
            explorerBase={explorerBase}
          />
        ) : (
          <>
            <SafeOverviewCards
              ethBalanceFormatted={formatEth(safeData.ethBalanceWei).replace(
                ' ETH',
                ''
              )}
              tokenCount={safeData.tokenBalances.length}
              threshold={safeData.info.threshold}
              ownerCount={safeData.info.owners.length}
              pendingTxCount={safeData.pendingTransactions.length}
            />

            <SafeOwnersCard
              owners={safeData.info.owners}
              explorerBase={explorerBase}
            />

            <SafePendingTransactions
              transactions={safeData.pendingTransactions}
              safeWalletUrl={safeData.safeWalletUrl}
              formatEth={(val) => formatEth(val).replace(' ETH', '')}
              formatDate={formatDate}
            />

            <SafeTransactionHistory
              transactions={safeData.transactionHistory}
              safeWalletUrl={safeData.safeWalletUrl}
              explorerBase={explorerBase}
              formatEth={(val) => formatEth(val).replace(' ETH', '')}
              formatDate={formatDate}
            />

            <SafeTokenBalances tokenBalances={safeData.tokenBalances} />

            <SafeDetailsCard
              safeAddress={safeAddress}
              version={safeData.info.version}
              nonce={safeData.info.nonce}
              companyEnsName={company?.ensName}
            />
          </>
        )}
      </div>
    </div>
  )
}
