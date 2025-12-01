import { ArrowRight } from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'
import { RegistrationProgress } from '@/app/(app)/dashboard/components/registration-progress'
import { getPendingRegistration } from '@/lib/auth/pending-registration'
import { getServerSession } from '@/lib/auth/server-session'
import {
  getCompanyByAddress,
  getCompanyByENS,
  getCompanyByFounderWallet,
} from '@/lib/blockchain/get-company'
import { getCompanyEvents } from '@/lib/blockchain/get-company-events'
import {
  BLOCK_EXPLORERS,
  STARTUPCHAIN_CHAIN_ID,
  type SupportedChainId,
  isSupportedChain,
} from '@/lib/blockchain/startupchain-config'

import { finalizeEnsRegistrationAction } from '../setup/actions'
import {
  CompanyCard,
  RegistrationHistory,
  RegistrationStatusCard,
} from './components'

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

function getExplorerBase(chainId: SupportedChainId): string {
  return BLOCK_EXPLORERS[chainId] ?? BLOCK_EXPLORERS[STARTUPCHAIN_CHAIN_ID]
}

function getEnsAppBase(chainId: SupportedChainId): string {
  return chainId === 1
    ? 'https://app.ens.domains/'
    : 'https://sepolia.app.ens.domains/'
}

type PageProps = {
  searchParams: Promise<{ chain?: string }>
}

export default async function EnsDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const chainId = parseChainId(params.chain)
  const explorerBase = getExplorerBase(chainId)
  const ensAppBase = getEnsAppBase(chainId)

  const cookieStore = await cookies()
  const session = await getServerSession({ cookies: cookieStore })
  const walletAddress = session?.walletAddress

  const pendingCookie = await getPendingRegistration()
  const isPendingForWallet =
    pendingCookie &&
    walletAddress &&
    pendingCookie.owner.toLowerCase() === walletAddress.toLowerCase()
  let pending = isPendingForWallet ? pendingCookie : null

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
      console.error('Auto-finalize ENS registration failed', err)
      // If it failed, keep pending state as-is for retry
    }
  }

  // Try multiple methods to find the company using dynamic chainId:
  // 1. By user's wallet address (if they are the owner)
  // 2. By pending registration's owner address (Safe address)
  // 3. By pending registration's ENS name
  // 4. By founder wallet address (searches all companies)
  let company = walletAddress
    ? await getCompanyByAddress(walletAddress, chainId)
    : null

  // If not found by direct address, try by pending registration owner
  if (!company && pending?.owner) {
    company = await getCompanyByAddress(pending.owner, chainId)
  }

  // If still not found, try by ENS name from completed registration
  if (!company && pending?.ensName && pending.status === 'completed') {
    company = await getCompanyByENS(pending.ensName, chainId)
  }

  // Last resort: search by founder wallet (slower but comprehensive)
  if (!company && walletAddress) {
    company = await getCompanyByFounderWallet(walletAddress, chainId)
  }

  // Get events by owner address (either user's wallet or pending registration owner)
  const eventsOwner = company?.ownerAddress || pending?.owner || walletAddress
  const events = eventsOwner ? await getCompanyEvents(eventsOwner, chainId) : []

  const latestEvent = events[0]

  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="ENS Company Names" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground mt-1 text-sm">
              View your registered company name, on-chain logs, and quick links
              to the explorer and ENS app.
            </p>
          </div>
          <Link
            href="/dashboard/setup"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            Register new name
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {pending && pending.status !== 'completed' && (
          <RegistrationProgress
            ensName={pending.ensName}
            readyAt={pending.readyAt}
            commitTxHash={pending.commitTxHash}
            status={pending.status}
            registrationTxHash={pending.registrationTxHash}
            companyTxHash={pending.companyTxHash}
            explorerBase={explorerBase}
          />
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <CompanyCard
            company={company}
            ensAppBase={ensAppBase}
            explorerBase={explorerBase}
            latestEventTxHash={latestEvent?.transactionHash}
          />

          <RegistrationStatusCard latestEvent={latestEvent} pending={pending} />
        </div>

        <RegistrationHistory
          events={events}
          pending={pending}
          explorerBase={explorerBase}
        />
      </div>
    </div>
  )
}
