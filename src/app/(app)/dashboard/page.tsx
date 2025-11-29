import { ActivityFeed, type ActivityItem } from './components/activity-feed'
import { CompanyOverview } from './components/company-overview'
import { CompanyToken } from './components/company-token'
import { DashboardHeader } from './components/dashboard-header'
import { MockBadge } from './components/mock-badge'
import {
  type Transaction,
  TreasurySummary,
} from './components/treasury-summary'

const mockCompany = {
  name: 'Acme Corp',
  ensName: 'acmecorp.eth',
  safeAddress: '0xAcDc20583948573920485739204857392048bEEf',
}

const mockTreasury = {
  totalBalance: '$420,690.15',
  transactions: [
    {
      id: 'tx-1',
      title: 'Sent ETH',
      subtitle: 'To: 0x8aA...5e3b',
      amount: '0.5',
      token: 'ETH',
      direction: 'out',
      timestamp: '2 hours ago',
    },
    {
      id: 'tx-2',
      title: 'Received USDC',
      subtitle: 'From: invoice.eth',
      amount: '5,000',
      token: 'USDC',
      direction: 'in',
      timestamp: '1 day ago',
    },
  ] as Transaction[],
}

const mockToken = {
  name: 'ACME',
  symbol: '$ACME',
  totalSupply: '1,000,000',
  contract: '0xAb5801038492018492018492018492018492c420',
}

const mockActivity: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'A new multisig transaction requires your signature.',
    description: 'Tx: #231 - Payroll Payout',
    timestamp: '5 mins ago',
    tone: 'info',
  },
  {
    id: 'act-2',
    title: "Your ENS name 'acmecorp.eth' renewal was successful.",
    description: '',
    timestamp: '3 days ago',
    tone: 'success',
  },
  {
    id: 'act-3',
    title: 'A new governance proposal has been created: #004 - Q3 Budget',
    description: '',
    timestamp: '4 days ago',
    tone: 'warning',
  },
]

export default function DashboardPage() {
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
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <CompanyOverview data={mockCompany} />
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
