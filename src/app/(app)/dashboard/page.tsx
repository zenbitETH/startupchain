import { cookies } from 'next/headers'

import { getServerSession } from '@/lib/auth/server-session'
import {
  type Company,
  getCompanyByAddress,
  getCompanyByFounderWallet,
} from '@/lib/blockchain/get-company'
import { getSafeDashboardData } from '@/lib/blockchain/safe-api'
import {
  BLOCK_EXPLORERS,
  CHAIN_NAMES,
  STARTUPCHAIN_CHAIN_ID,
  type SupportedChainId,
  isSupportedChain,
} from '@/lib/blockchain/startupchain-config'
import { formatEth, shortenAddress } from '@/lib/utils'

import { ActivityFeed, type ActivityItem } from './components/activity-feed'
import { CompanyOverview } from './components/company-overview'
import { CompanyToken } from './components/company-token'
import { DashboardHeader } from './components/dashboard-header'
import { PendingEnsCard } from './components/pending-ens-card'
import {
  type Transaction,
  TreasurySummary,
} from './components/treasury-summary'
import {
  type EnsRegistrationRecord,
  finalizeEnsRegistrationAction,
  getEnsRegistrationStatusByOwnerAction,
} from './setup/actions'

const mockToken = {
  name: 'Company Token',
  symbol: '$TOKEN',
  totalSupply: '0',
  contract: '0x0000000000000000000000000000000000000000',
}

const mockActivity: ActivityItem[] = []

type TreasuryData = {
  totalBalance: string
  transactions: Transaction[]
  safeWalletUrl?: string
  isLive: boolean
}

/**
 * Parse and validate chainId from search params.
 * Falls back to STARTUPCHAIN_CHAIN_ID if invalid or unsupported.
 */
function parseChainId(chainParam: string | undefined): SupportedChainId {
  if (!chainParam) return STARTUPCHAIN_CHAIN_ID

  const parsed = Number(chainParam)
  if (Number.isNaN(parsed) || !isSupportedChain(parsed)) {
    return STARTUPCHAIN_CHAIN_ID
  }

  return parsed as SupportedChainId
}

async function getCompanyData(chainId: SupportedChainId): Promise<{
  company: Company | null
  chainId: SupportedChainId
  pending: EnsRegistrationRecord | null
  treasury: TreasuryData
}> {
  const cookieStore = await cookies()
  const session = await getServerSession({ cookies: cookieStore })

  const defaultTreasury: TreasuryData = {
    totalBalance: '$0.00',
    transactions: [],
    isLive: false,
  }

  if (!session?.walletAddress) {
    return {
      company: null,
      chainId,
      pending: null,
      treasury: defaultTreasury,
    }
  }

  let pending = await getEnsRegistrationStatusByOwnerAction(
    session.walletAddress
  )

  if (
    pending &&
    pending.status !== 'completed' &&
    pending.status !== 'failed' &&
    Date.now() >= pending.readyAt
  ) {
    try {
      pending = await finalizeEnsRegistrationAction({
        ensName: pending.ensName,
      })
    } catch (err) {
      // Re-read in case the action marked failure
      pending = await getEnsRegistrationStatusByOwnerAction(
        session.walletAddress
      )
      console.error('Auto-finalize ENS registration failed', err)
    }
  }

  // Try to find company by wallet address first - use the dynamic chainId
  let company = await getCompanyByAddress(session.walletAddress, chainId)

  // If not found, try by pending registration owner (Safe address)
  if (!company && pending?.status === 'completed') {
    company = await getCompanyByAddress(pending.owner, chainId)
  }

  // Last resort: search by founder wallet
  if (!company) {
    company = await getCompanyByFounderWallet(session.walletAddress, chainId)
  }

  // Fetch treasury data from Safe API if we have a Safe address
  let treasury: TreasuryData = defaultTreasury

  if (company?.safeAddress) {
    try {
      const safeData = await getSafeDashboardData(company.safeAddress, chainId)

      if (safeData.info) {
        // Format ETH balance
        const formattedBalance = formatEth(safeData.ethBalanceWei)

        // Convert transaction history to our format
        const transactions: Transaction[] = safeData.transactionHistory
          .slice(0, 3)
          .map((tx, idx) => {
            const isIncoming = tx.txType === 'ETHEREUM_TRANSACTION'
            const ethAmount = formatEth(tx.value).replace(' ETH', '')
            const date = tx.executionDate ?? tx.submissionDate
            const formattedDate = date
              ? new Date(date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Pending'

            return {
              id: tx.safeTxHash ?? tx.txHash ?? `tx-${idx}`,
              title: isIncoming
                ? 'Received'
                : `To ${shortenAddress(tx.to as `0x${string}`)}`,
              subtitle:
                tx.txType === 'ETHEREUM_TRANSACTION'
                  ? 'Incoming transfer'
                  : 'Outgoing',
              amount: ethAmount,
              token: 'ETH',
              direction: isIncoming ? 'in' : 'out',
              timestamp: formattedDate,
            }
          })

        treasury = {
          totalBalance: formattedBalance,
          transactions,
          safeWalletUrl: safeData.safeWalletUrl,
          isLive: true,
        }
      }
    } catch (err) {
      console.error('Failed to fetch Safe data:', err)
    }
  }

  return {
    company,
    chainId,
    pending,
    treasury,
  }
}

type PageProps = {
  searchParams: Promise<{ chain?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const chainId = parseChainId(params.chain)
  const {
    company,
    chainId: resolvedChainId,
    pending,
    treasury,
  } = await getCompanyData(chainId)
  const chainName = CHAIN_NAMES[resolvedChainId] ?? 'Unknown'
  const explorerBase = BLOCK_EXPLORERS[resolvedChainId]

  // If no company found, show empty state
  if (!company) {
    return (
      <div className="bg-background text-foreground">
        <DashboardHeader title="Dashboard" />

        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-6 pb-12 md:px-6">
          <div className="flex flex-col gap-3">
            <div className="md:hidden">
              <h1 className="text-foreground text-3xl leading-tight font-bold">
                Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">
              You haven&apos;t registered a company yet.
            </p>
          </div>

          <div className="bg-card border-border rounded-2xl border p-8 text-center">
            <h2 className="mb-2 text-xl font-semibold">Get Started</h2>
            <p className="text-muted-foreground mb-4">
              Register your company with an ENS name and Safe multisig to get
              started.
            </p>
            <a
              href="/"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-xl px-6 py-3 font-medium transition-colors"
            >
              Check ENS Availability
            </a>
          </div>

          {pending && (
            <PendingEnsCard
              record={{
                ensName: pending.ensName,
                owner: pending.owner,
                commitTxHash: pending.commitTxHash,
                registrationTxHash: pending.registrationTxHash,
                companyTxHash: pending.companyTxHash,
                readyAt: pending.readyAt,
                status: pending.status,
              }}
              explorerBase={explorerBase}
            />
          )}
        </div>
      </div>
    )
  }

  // Extract company name from ENS (e.g., "acmecorp.eth" -> "Acmecorp")
  const companyName =
    company.ensName.replace('.eth', '').charAt(0).toUpperCase() +
    company.ensName.replace('.eth', '').slice(1)

  const companyData = {
    name: companyName,
    ensName: company.ensName,
    ownerAddress: company.ownerAddress,
    threshold: company.threshold,
    founderCount: company.founders.length,
    chainName,
  }

  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="Dashboard" />

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-3">
          <div className="md:hidden">
            <h1 className="text-foreground text-3xl leading-tight font-bold">
              Dashboard
            </h1>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground">
              Welcome back, here&apos;s an overview of your on-chain company.
            </p>
            <span className="text-muted-foreground bg-muted rounded-full px-2 py-1 text-xs">
              {chainName}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <CompanyOverview data={companyData} />
          </div>

          <div className="lg:col-span-2">
            <TreasurySummary data={treasury} />
          </div>

          <CompanyToken data={mockToken} />

          <div className="lg:col-span-3">
            <ActivityFeed data={mockActivity} />
          </div>
        </div>
      </div>
    </div>
  )
}
