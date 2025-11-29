import { cookies } from 'next/headers'

import { getServerSession } from '@/lib/auth/server-session'
import { type Company, getCompanyByAddress } from '@/lib/blockchain/get-company'
import {
  CHAIN_NAMES,
  STARTUPCHAIN_CHAIN_ID,
  type SupportedChainId,
} from '@/lib/blockchain/startupchain-config'

import { ActivityFeed, type ActivityItem } from './components/activity-feed'
import { CompanyOverview } from './components/company-overview'
import { CompanyToken } from './components/company-token'
import { DashboardHeader } from './components/dashboard-header'
import {
  type Transaction,
  TreasurySummary,
} from './components/treasury-summary'

// Placeholder data while we wire up real contract reads
const mockTreasury = {
  totalBalance: '$0.00',
  transactions: [] as Transaction[],
}

const mockToken = {
  name: 'Company Token',
  symbol: '$TOKEN',
  totalSupply: '0',
  contract: '0x0000000000000000000000000000000000000000',
}

const mockActivity: ActivityItem[] = []

async function getCompanyData(): Promise<{
  company: Company | null
  chainId: SupportedChainId
}> {
  const cookieStore = await cookies()
  const session = await getServerSession({ cookies: cookieStore })

  if (!session?.walletAddress) {
    return { company: null, chainId: STARTUPCHAIN_CHAIN_ID as SupportedChainId }
  }

  const company = await getCompanyByAddress(
    session.walletAddress,
    STARTUPCHAIN_CHAIN_ID
  )

  return {
    company,
    chainId: STARTUPCHAIN_CHAIN_ID as SupportedChainId,
  }
}

export default async function DashboardPage() {
  const { company, chainId } = await getCompanyData()
  const chainName = CHAIN_NAMES[chainId] ?? 'Unknown'

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
    safeAddress: company.safeAddress,
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
            <TreasurySummary data={mockTreasury} />
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
